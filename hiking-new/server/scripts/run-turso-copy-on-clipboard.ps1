param(
  [string]$SourceUrl = "libsql://hiking-china-leo-hyper.aws-us-east-2.turso.io",
  [string]$TargetUrl = "libsql://hiking-china-asia-leo-hyper.aws-ap-northeast-1.turso.io",
  [int]$WaitSeconds = 300,
  [switch]$TargetTokenFirst,
  [switch]$ResetTarget
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $PSCommandPath

function Read-ClipboardToken {
  $value = (Get-Clipboard -Raw -ErrorAction Stop).Trim()
  if ($value.Length -lt 40 -or $value -match "\s") {
    throw "Clipboard does not contain a valid single-line Turso token."
  }
  return $value
}

$firstToken = Read-ClipboardToken
$secondToken = $null
$deadline = (Get-Date).AddSeconds($WaitSeconds)
while ((Get-Date) -lt $deadline) {
  Start-Sleep -Seconds 1
  $candidate = Read-ClipboardToken
  if ($candidate -ne $firstToken) {
    $secondToken = $candidate
    break
  }
}

if (-not $secondToken) {
  throw "Timed out waiting for the second token on the clipboard."
}

if ($TargetTokenFirst) {
  $targetToken = $firstToken
  $sourceToken = $secondToken
  Write-Output "[copy] Target token loaded from clipboard."
  Write-Output "[copy] Source token loaded from clipboard."
} else {
  $sourceToken = $firstToken
  $targetToken = $secondToken
  Write-Output "[copy] Source token loaded from clipboard."
  Write-Output "[copy] Target token loaded from clipboard."
}

$env:SOURCE_TURSO_URL = $SourceUrl
$env:SOURCE_TURSO_TOKEN = $sourceToken
$env:TARGET_TURSO_URL = $TargetUrl
$env:TARGET_TURSO_TOKEN = $targetToken

$copyArgs = @((Join-Path $scriptDir "copy-turso-database.cjs"))
if ($ResetTarget) {
  $copyArgs += "--reset"
}

& node @copyArgs
if ($LASTEXITCODE -ne 0) {
  throw "Turso copy failed with exit code $LASTEXITCODE."
}
