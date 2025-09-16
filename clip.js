#!/usr/bin/env node
/**
 * Clip an MP3 using ffmpeg via child_process.
 * Usage:
 *   node clip.js input.mp3 00:01:00 00:02:30 out.mp3
 *   node clip.js input.mp3 60 150 out.mp3   (start/end in seconds)
 *
 * Notes:
 * - If you want *no re-encoding* (fastest), we use "-c copy" when possible.
 * - If you need sample-perfect trims or to fade, we’ll re-encode.
 */

const { execFile } = require('node:child_process');
const path = require('node:path');

function parseTimeArg(t) {
  if (/^\d+(\.\d+)?$/.test(t)) return Number(t); // seconds as number
  // parse HH:MM:SS(.ms) → seconds
  const parts = t.split(':').map(Number);
  if (parts.some(Number.isNaN)) throw new Error('Bad time format');
  let s = 0;
  while (parts.length) s = s * 60 + parts.shift();
  return s;
}

function fmtHMS(sec) {
  const s = Number(sec);
  const H = Math.floor(s / 3600);
  const M = Math.floor((s % 3600) / 60);
  const S = (s % 60).toFixed(3).padStart(6, '0'); // keep ms
  return [H, M, S].map((v, i) => (i < 2 ? String(v).padStart(2, '0') : v)).join(':');
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve({ stdout, stderr });
    });
  });
}

async function main() {
  const [input, startArg, endArg, output] = process.argv.slice(2);
  if (!input || !startArg || !endArg || !output) {
    console.log('Usage:\n  node clip.js <in.mp3> <start> <end> <out.mp3>');
    console.log('Examples:\n  node clip.js song.mp3 00:01:00 00:02:30 chorus.mp3');
    console.log('  node clip.js song.mp3 60 150 chorus.mp3');
    process.exit(1);
  }

  const start = parseTimeArg(startArg);
  const end = parseTimeArg(endArg);
  if (end <= start) throw new Error('end must be > start');

  const duration = end - start;
  const outPath = path.resolve('output', output);

  // Fast path: copy without re-encoding (very quick, frame-accurate)
  // If ffmpeg fails (rare, e.g. weird VBR edge cases), we fall back to re-encode.
  const fastArgs = [
    '-ss', fmtHMS(start),
    '-t', fmtHMS(duration),
    '-i', input,
    '-c', 'copy',
    '-y', outPath
  ];

  try {
    await run('ffmpeg', fastArgs);
    console.log(`✓ Wrote ${outPath} (copied, no re-encode)`);
    return;
  } catch (e) {
    console.warn('Fast copy failed, retrying with re-encode...', e.message);
  }

  // Fallback: re-encode to MP3 (slower but sample-precise and always works)
  const reencArgs = [
    '-ss', fmtHMS(start),
    '-t', fmtHMS(duration),
    '-i', input,
    '-vn',
    '-ar', '44100',
    '-ac', '2',
    '-b:a', '192k',
    '-y', outPath
  ];

  await run('ffmpeg', reencArgs);
  console.log(`✓ Wrote ${outPath} (re-encoded)`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
