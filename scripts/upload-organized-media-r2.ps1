param(
  [string]$Bucket = "exit-smiling-media",
  [string]$MediaDir = "cloudinary-export/files/files",
  [string]$MapPath = "media-r2-map.csv"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $MapPath)) {
  throw "Map file not found: $MapPath"
}

if (-not (Test-Path $MediaDir)) {
  throw "Media directory not found: $MediaDir"
}

$rows = Import-Csv $MapPath
foreach ($row in $rows) {
  $source = Join-Path $MediaDir $row.old_file
  if (-not (Test-Path $source)) {
    throw "Missing local media file: $source"
  }

  Write-Host "Uploading $($row.new_key)"
  npx.cmd wrangler r2 object put "$Bucket/$($row.new_key)" --file "$source" --remote
}

Write-Host "Uploaded $($rows.Count) organized media files to R2 bucket '$Bucket'."
