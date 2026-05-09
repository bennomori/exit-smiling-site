param(
  [string]$SiteUrl = "https://www.exitsmiling.com.au",
  [string]$ApiUrl = "",
  [string]$PublishableKey = "",
  [string]$MediaUrl = "https://exit-smiling-media.bennoclark.workers.dev/logos/exit-smiling-logo-yellow-transparent.png",
  [string]$EnvPath = ".env.production"
)

$ErrorActionPreference = "Stop"

function Read-EnvFile {
  param([string]$Path)

  $values = @{}
  if (-not (Test-Path $Path)) {
    return $values
  }

  Get-Content -Path $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) {
      return
    }

    $name, $value = $line.Split("=", 2)
    $values[$name.Trim()] = $value.Trim()
  }

  return $values
}

function Test-Request {
  param(
    [string]$Name,
    [string]$Url,
    [hashtable]$Headers = @{},
    [int[]]$AllowedStatusCodes = @(200)
  )

  try {
    $response = Invoke-WebRequest -Uri $Url -Headers $Headers -UseBasicParsing -TimeoutSec 20
    $statusCode = [int]$response.StatusCode
    $ok = $AllowedStatusCodes -contains $statusCode

    if ($ok) {
      Write-Host "[PASS] $Name ($statusCode)"
      return $true
    }

    Write-Host "[FAIL] $Name returned $statusCode"
    return $false
  } catch {
    $statusCode = $null
    if ($_.Exception.Response) {
      $statusCode = [int]$_.Exception.Response.StatusCode
    }

    if ($statusCode -and ($AllowedStatusCodes -contains $statusCode)) {
      Write-Host "[PASS] $Name ($statusCode)"
      return $true
    }

    Write-Host "[FAIL] $Name - $($_.Exception.Message)"
    return $false
  }
}

function Get-SiteBundle {
  param([string]$Url)

  $html = (Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 20).Content
  $asset = [regex]::Match($html, 'assets/[^"'']+\.js').Value

  if (-not $asset) {
    throw "Could not find the production JS bundle in $Url"
  }

  $bundleUrl = "$Url".TrimEnd("/") + "/$asset"
  $js = (Invoke-WebRequest -Uri $bundleUrl -UseBasicParsing -TimeoutSec 20).Content

  return @{
    Asset = $asset
    JavaScript = $js
  }
}

$envValues = Read-EnvFile -Path $EnvPath
if (-not $ApiUrl) {
  $ApiUrl = $envValues["VITE_MEDUSA_URL"]
}
if (-not $PublishableKey) {
  $PublishableKey = $envValues["VITE_MEDUSA_PUBLISHABLE_KEY"]
}

$checks = New-Object System.Collections.Generic.List[bool]

Write-Host "Exit Smiling live health check"
Write-Host "Site: $SiteUrl"
Write-Host "API:  $ApiUrl"
Write-Host ""

$checks.Add((Test-Request -Name "Website" -Url $SiteUrl))
$checks.Add((Test-Request -Name "Media Worker" -Url $MediaUrl))

if ($ApiUrl) {
  $checks.Add((Test-Request -Name "Backend API requires publishable key" -Url "$ApiUrl/store/regions" -AllowedStatusCodes @(400)))
} else {
  Write-Host "[FAIL] Backend API - missing VITE_MEDUSA_URL"
  $checks.Add($false)
}

if ($ApiUrl -and $PublishableKey) {
  $headers = @{ "x-publishable-api-key" = $PublishableKey }
  $checks.Add((Test-Request -Name "Medusa products API" -Url "$ApiUrl/store/products?limit=1" -Headers $headers))
} else {
  Write-Host "[FAIL] Medusa products API - missing API URL or publishable key"
  $checks.Add($false)
}

try {
  $bundle = Get-SiteBundle -Url $SiteUrl
  Write-Host "[PASS] Production JS bundle found ($($bundle.Asset))"
  $checks.Add($true)

  $hasCloudinary = $bundle.JavaScript.Contains("res.cloudinary.com")
  $hasOldR2CloudinaryPath = $bundle.JavaScript.Contains("/cloudinary/")

  if ($hasCloudinary -or $hasOldR2CloudinaryPath) {
    Write-Host "[FAIL] Production JS still contains old media references"
    $checks.Add($false)
  } else {
    Write-Host "[PASS] Production JS has no Cloudinary or old R2 cloudinary-path references"
    $checks.Add($true)
  }
} catch {
  Write-Host "[FAIL] Production JS bundle check - $($_.Exception.Message)"
  $checks.Add($false)
}

Write-Host ""

if ($checks.Contains($false)) {
  Write-Host "Health check failed."
  exit 1
}

Write-Host "Health check passed."
