$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$cache = Join-Path $root "data/osm-cache"
New-Item -ItemType Directory -Force -Path $cache | Out-Null

$ids = @("18731549", "18731550", "19700005", "19700031", "19700085", "18970848", "17822607")
$endpoints = @(
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter"
)

foreach ($id in $ids) {
  $out = Join-Path $cache "$id.json"
  $ok = $false
  $query = "[out:json][timeout:180];relation($id);out geom;"
  $body = "data=" + [uri]::EscapeDataString($query)
  foreach ($endpoint in $endpoints) {
    try {
      Invoke-WebRequest -Uri $endpoint -Method Post -Body $body `
        -ContentType "application/x-www-form-urlencoded" `
        -Headers @{ "User-Agent" = "HikingChinaRouteImport/1.0"; "Accept" = "application/json" } `
        -OutFile $out -TimeoutSec 180
      $text = Get-Content $out -Raw
      if ($text -match '"elements"') {
        $ok = $true
        Write-Host "ok $id $((Get-Item $out).Length) bytes"
        break
      }
    } catch {
      Write-Host "fail $id $($_.Exception.Message)"
    }
  }
  if (-not $ok) { Write-Host "MISSING $id" }
}
