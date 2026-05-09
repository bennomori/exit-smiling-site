# Exit Smiling Video Optimization

Use FFmpeg to make self-hosted R2 videos smaller, faster to start, and more browser-compatible.

FFmpeg is the tool. The target delivery format for the site is:

- MP4 container
- H.264 video
- AAC audio
- `yuv420p` pixel format
- `faststart` enabled
- Sensible compression/resolution for web playback

## Install FFmpeg On Windows

Option A, using Winget:

```powershell
winget install Gyan.FFmpeg
```

Then close and reopen PowerShell and check:

```powershell
ffmpeg -version
```

If Windows still cannot find FFmpeg, locate `ffmpeg.exe` and pass the full path:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\optimize-r2-videos.ps1 -FfmpegPath "C:\path\to\ffmpeg.exe"
```

## Optimize Videos Locally

From Windows PowerShell:

```powershell
cd C:\exit-smiling-site
powershell -ExecutionPolicy Bypass -File scripts\optimize-r2-videos.ps1
```

This downloads the videos listed in `media-r2-map.csv` from the R2 media Worker and writes optimized versions under:

```text
video-optimized\optimized
```

No live files are changed by default.

## Upload Optimized MP4s To R2

Only do this after reviewing the optimized files locally.

```powershell
cd C:\exit-smiling-site
powershell -ExecutionPolicy Bypass -File scripts\optimize-r2-videos.ps1 -Upload
```

This overwrites existing `.mp4` objects in R2 using the same key, so the live URLs stay the same.

MOV files are converted to `.mp4` locally but are not uploaded automatically, because those require a code/media-map update to point the site at the new `.mp4` key.

## Recommended Defaults

Current script defaults:

- Max width: `1280`
- CRF: `24`
- Preset: `medium`
- Audio: `128k AAC`

Lower CRF means higher quality/larger files. Higher CRF means smaller files/lower quality.

Useful variants:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\optimize-r2-videos.ps1 -MaxWidth 1920 -Crf 23
```

```powershell
powershell -ExecutionPolicy Bypass -File scripts\optimize-r2-videos.ps1 -MaxWidth 960 -Crf 26
```

## After Uploading

Run the live health check:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\check-live-health.ps1
```

Then manually check:

- Home page hero/media sections.
- Latest releases teaser videos.
- Band bio videos.
- Studio session videos.
- `/media-admin` previews.

## Do Not

- Do not overwrite R2 videos before reviewing the optimized files.
- Do not upload converted `.mov` files as `.mp4` without updating the site code to use the `.mp4` path.
- Do not delete the original R2 fallback files until the optimized videos have been tested in production.
