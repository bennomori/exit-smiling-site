param(
  [string]$Bucket = "exit-smiling-media",
  [string]$Prefix = "cloudinary",
  [string]$MediaDir = "cloudinary-export/files/files"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $MediaDir)) {
  throw "Media directory not found: $MediaDir"
}

$files = Get-ChildItem -Path $MediaDir -File
if (-not $files.Count) {
  throw "No media files found in: $MediaDir"
}

foreach ($file in $files) {
  $key = "$Prefix/$($file.Name)"
  Write-Host "Uploading $key"
  npx.cmd wrangler r2 object put "$Bucket/$key" --file "$($file.FullName)" --remote
}

Write-Host "Uploaded $($files.Count) files to R2 bucket '$Bucket' under '$Prefix/'."
