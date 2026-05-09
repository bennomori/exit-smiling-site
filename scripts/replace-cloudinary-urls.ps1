param(
  [string]$MediaBaseUrl = "https://media.exitsmiling.com.au/cloudinary"
)

$ErrorActionPreference = "Stop"

$sourceFiles = Get-ChildItem -Path "src" -Filter "*.jsx" -File
$pattern = "https://res\.cloudinary\.com/[^'`"\)\s]+"

foreach ($sourceFile in $sourceFiles) {
  $content = Get-Content -Path $sourceFile.FullName -Raw
  $updated = [regex]::Replace($content, $pattern, {
    param($match)

    $url = $match.Value
    if ($url -like "https://res.cloudinary.com/...*") {
      return $url
    }

    $cleanUrl = ($url -split "\?")[0]
    $fileName = Split-Path ([uri]$cleanUrl).AbsolutePath -Leaf
    return "$MediaBaseUrl/$fileName"
  })

  if ($updated -ne $content) {
    Set-Content -Path $sourceFile.FullName -Value $updated -NoNewline
    Write-Host "Updated $($sourceFile.FullName)"
  }
}

Write-Host "Cloudinary URLs replaced with $MediaBaseUrl"
