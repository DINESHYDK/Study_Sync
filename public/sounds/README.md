# Ambient Sound Files

Place five looping MP3 files here. File names must match exactly:

- `rain.mp3`   — Rainfall / thunderstorm ambience
- `lofi.mp3`   — Lofi hip-hop / chill study beats
- `cafe.mp3`   — Coffee shop background noise
- `forest.mp3` — Birds, wind, nature sounds
- `noise.mp3`  — White / brown noise

## Creating silent placeholder files (requires ffmpeg)

Run these once in the project root to create silent 3-second placeholders:

```bash
ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 3 public/sounds/rain.mp3
ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 3 public/sounds/lofi.mp3
ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 3 public/sounds/cafe.mp3
ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 3 public/sounds/forest.mp3
ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 3 public/sounds/noise.mp3
```

## Recommended free sources

- https://freesound.org (CC0 / CC-BY licences)
- https://pixabay.com/music (royalty-free)
- https://soundbible.com
