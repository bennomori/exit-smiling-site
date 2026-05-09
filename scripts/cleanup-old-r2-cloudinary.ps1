param(
  [string]$Bucket = "exit-smiling-media",
  [string]$MapPath = "media-r2-map.csv",
  [switch]$Delete
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $MapPath)) {
  throw "Map file not found: $MapPath"
}

$rows = Import-Csv $MapPath
$oldKeys = $rows |
  ForEach-Object { "cloudinary/$($_.old_file)" } |
  Sort-Object -Unique

if (-not $Delete) {
  Write-Host "Dry run only. These legacy R2 objects would be deleted from bucket '$Bucket':"
  $oldKeys | ForEach-Object { Write-Host "  $_" }
  Write-Host ""
  Write-Host "No files were deleted. Re-run with -Delete only after the live site has been stable for several days."
  exit 0
}

$confirm = Read-Host "Type DELETE-OLD-CLOUDINARY to delete $($oldKeys.Count) legacy R2 objects from '$Bucket'"
if ($confirm -ne "DELETE-OLD-CLOUDINARY") {
  Write-Host "Cancelled. No files were deleted."
  exit 0
}

foreach ($key in $oldKeys) {
  npx.cmd wrangler r2 object delete "$Bucket/$key" --remote
}

Write-Host "Deleted $($oldKeys.Count) legacy R2 cloudinary fallback objects from '$Bucket'."
