# MP3 Clipper

A simple tool to clip MP3 files and create videos by combining audio with images.

## Generating Transcripts for Audio

AI: Gemini 2.5 Pro
https://aistudio.google.com/prompts/new_chat?model=gemini-2.5-pro

The text prompt: Can you create an accurate and clean transcript for this audio. also include speaker identification. Here are the speaker's: Jaime, Michael, Kieren. Please dont cut anything out and be sure to include time stamps. Also please break up the transcript into sections related to the topics.

## Making Audio Clips

Use `clip.js` to extract segments from MP3 files:

```bash
node clip.js input.mp3 start_time end_time output_name.mp3
```

### Examples

```bash
# Using HH:MM:SS format
node clip.js song.mp3 00:01:00 00:02:30 chorus.mp3

# Using seconds
node clip.js song.mp3 60 150 chorus.mp3
```

All clips are automatically saved to the `output/` directory.

## Creating Videos from Audio + Image

Use ffmpeg to combine an MP3 clip with an image to create a video:

```bash
ffmpeg -loop 1 -i image.png -i output/clip.mp3 -c:v libx264 -c:a aac -b:a 192k -shortest output/video.mp4
```

### Video Creation Examples

```bash
# Create video with static image
ffmpeg -loop 1 -i image.png -i output/chorus.mp3 -c:v libx264 -c:a aac -b:a 192k -shortest output/chorus_video.mp4

# With optimized settings for still image and audio
ffmpeg -loop 1 -i image.png -i clip.mp3 -c:v libx264 -tune stillimage -c:a aac -b:a 192k -shortest -pix_fmt yuv420p output.mp4
```

## Concatenating Multiple Videos

Use ffmpeg to combine multiple video files into a single output:

```bash
ffmpeg -i video1.mp4 -i video2.mp4 \
  -filter_complex "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]" \
  -map "[v]" -map "[a]" output.mp4
```

This command:
- Takes two input videos (`video1.mp4` and `video2.mp4`)
- Uses the `concat` filter to join them sequentially
- `n=2`: specifies 2 input files
- `v=1:a=1`: outputs 1 video stream and 1 audio stream
- Both video and audio tracks are concatenated seamlessly
- Outputs the combined result to `output.mp4`

You can extend this to concatenate more videos by adding more inputs and adjusting the `n=` parameter accordingly.

## Requirements

- Node.js
- ffmpeg (for both clipping and video creation)

Install ffmpeg:
- macOS: `brew install ffmpeg`
- Ubuntu: `sudo apt install ffmpeg`
- Windows: Download from https://ffmpeg.org/
