param(
  [string]$MediaBaseUrl = "https://exit-smiling-media.bennoclark.workers.dev",
  [string]$MapPath = "media-r2-map.csv"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $MapPath)) {
  throw "Map file not found: $MapPath"
}

$rows = Import-Csv $MapPath
$sourceFiles = @(
  "src/App.jsx",
  "src/PosApp.jsx"
)

foreach ($sourceFile in $sourceFiles) {
  $content = Get-Content -Path $sourceFile -Raw
  $updated = $content

  foreach ($row in $rows) {
    $oldUrl = "$MediaBaseUrl/cloudinary/$($row.old_file)"
    $newUrl = "$MediaBaseUrl/$($row.new_key)"
    $updated = $updated.Replace($oldUrl, $newUrl)
  }

  if ($updated -ne $content) {
    Set-Content -Path $sourceFile -Value $updated -NoNewline
    Write-Host "Updated $sourceFile"
  }
}

Write-Host "Applied organized media URLs using $MapPath"
