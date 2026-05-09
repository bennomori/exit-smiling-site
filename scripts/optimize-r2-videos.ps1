param(
  [string]$MapPath = "media-r2-map.csv",
  [string]$MediaBaseUrl = "https://exit-smiling-media.bennoclark.workers.dev",
  [string]$WorkDir = "video-optimized",
  [string]$FfmpegPath = "ffmpeg",
  [int]$MaxWidth = 1280,
  [int]$Crf = 24,
  [string]$Preset = "medium",
  [switch]$Upload,
  [string]$Bucket = "exit-smiling-media"
)

$ErrorActionPreference = "Stop"

function Resolve-CommandPath {
  param([string]$NameOrPath)

  if (Test-Path $NameOrPath) {
    return (Resolve-Path $NameOrPath).Path
  }

  $command = Get-Command $NameOrPath -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  throw "$NameOrPath is not installed or not available in PATH. Pass -FfmpegPath with the full path to ffmpeg.exe if needed."
}

function Convert-ToSafePath {
  param([string]$Key)

  return $Key -replace "[/\\]", [IO.Path]::DirectorySeparatorChar
}

$resolvedFfmpeg = Resolve-CommandPath $FfmpegPath

if ($Upload) {
  Resolve-CommandPath "npx.cmd" | Out-Null
}

if (-not (Test-Path $MapPath)) {
  throw "Map file not found: $MapPath"
}

$videoRows = Import-Csv $MapPath |
  Where-Object { $_.new_key -match "\.(mp4|mov)$" } |
  Sort-Object new_key

if (-not $videoRows.Count) {
  Write-Host "No video rows found in $MapPath"
  exit 0
}

$downloadDir = Join-Path $WorkDir "source"
$outputDir = Join-Path $WorkDir "optimized"
New-Item -ItemType Directory -Force -Path $downloadDir, $outputDir | Out-Null

Write-Host "Optimizing $($videoRows.Count) videos"
Write-Host "Output folder: $outputDir"
Write-Host "Max width: $MaxWidth"
Write-Host "CRF: $Crf"
Write-Host "Preset: $Preset"
Write-Host ""

foreach ($row in $videoRows) {
  $sourceUrl = "$MediaBaseUrl/$($row.new_key)"
  $sourcePath = Join-Path $downloadDir (Convert-ToSafePath $row.new_key)
  $sourceFolder = Split-Path $sourcePath -Parent
  New-Item -ItemType Directory -Force -Path $sourceFolder | Out-Null

  $extension = [IO.Path]::GetExtension($row.new_key).ToLowerInvariant()
  $outputKey = if ($extension -eq ".mov") {
    [IO.Path]::ChangeExtension($row.new_key, ".mp4") -replace "\\", "/"
  } else {
    $row.new_key
  }

  $outputPath = Join-Path $outputDir (Convert-ToSafePath $outputKey)
  $outputFolder = Split-Path $outputPath -Parent
  New-Item -ItemType Directory -Force -Path $outputFolder | Out-Null

  if (-not (Test-Path $sourcePath)) {
    Write-Host "Downloading $($row.new_key)"
    Invoke-WebRequest -Uri $sourceUrl -OutFile $sourcePath -UseBasicParsing
  }

  Write-Host "Optimizing $($row.new_key) -> $outputKey"
  & $resolvedFfmpeg `
    -y `
    -i $sourcePath `
    -map 0:v:0 `
    -map 0:a:0? `
    -sn `
    -vf "scale='min($MaxWidth,iw)':-2" `
    -c:v libx264 `
    -preset $Preset `
    -crf $Crf `
    -pix_fmt yuv420p `
    -c:a aac `
    -b:a 128k `
    -movflags +faststart `
    $outputPath

  if ($Upload) {
    if ($extension -eq ".mov") {
      Write-Host "Skipping upload for MOV conversion. Update code/media map to use $outputKey first."
    } else {
      Write-Host "Uploading optimized MP4 to R2: $outputKey"
      npx.cmd wrangler r2 object put "$Bucket/$outputKey" --file $outputPath --remote
    }
  }
}

Write-Host ""
Write-Host "Video optimization complete."
if (-not $Upload) {
  Write-Host "Dry run upload mode: optimized files were created locally only."
  Write-Host "Review files in $outputDir. Re-run with -Upload to overwrite MP4 objects in R2."
}
