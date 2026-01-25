$ErrorActionPreference = 'Continue'
$base = $env:VITE_API_URL
if (-not $base -or $base -eq '') {
  $base = "https://smartcampost-backend.onrender.com/api"
} else {
  $base = $base.TrimEnd('/')
  if (-not $base.EndsWith('/api')) { $base = $base + '/api' }
}
$file = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Definition) '..\src\services\coverage\coverage.api.ts'
$file = Resolve-Path $file
$text = Get-Content $file -Raw

$pattern = '(?s)\{[^}]*?id\s*:\s*"(?<id>[^\"]+)"[^}]*?method\s*:\s*"(?<method>GET|POST|PUT|PATCH|DELETE)"[^}]*?path\s*:\s*"(?<path>[^\"]+)"'
$allMatches = [regex]::Matches($text, $pattern)

$results = @()

foreach ($m in $allMatches) {
  $id = $m.Groups['id'].Value
  $method = $m.Groups['method'].Value
  $path = $m.Groups['path'].Value
  $uri = $base + ($path -replace '\{[^}]+\}', '1')
  $body = $null
  if ($method -in @('POST','PUT','PATCH')) { $body = '{}' }
  Write-Host "Calling $method $uri (id=$id)"
  try {
    if ($body) {
      $res = Invoke-RestMethod -Uri $uri -Method $method -Body $body -ContentType 'application/json' -ErrorAction Stop
      $status = 200
      $results += @{ id=$id; method=$method; path=$path; uri=$uri; ok=$true; status=$status; data=$res }
    } else {
      $res = Invoke-RestMethod -Uri $uri -Method $method -ErrorAction Stop
      $status = 200
      $results += @{ id=$id; method=$method; path=$path; uri=$uri; ok=$true; status=$status; data=$res }
    }
  } catch {
    $err = $_.Exception
    $resp = $_.Exception.Response
    if ($null -ne $resp) {
      try {
        $stream = $resp.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $textErr = $reader.ReadToEnd()
        $statusCode = $resp.StatusCode.value__
        $results += @{ id=$id; method=$method; path=$path; uri=$uri; ok=$false; status=$statusCode; error=$textErr }
      } catch {
        $results += @{ id=$id; method=$method; path=$path; uri=$uri; ok=$false; status=0; error=$err.Message }
      }
    } else {
      $results += @{ id=$id; method=$method; path=$path; uri=$uri; ok=$false; status=0; error=$err.Message }
    }
  }
}

$outFile = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Definition) '..\coverage-results.json'
$outFile = [System.IO.Path]::GetFullPath($outFile)
$results | ConvertTo-Json -Depth 6 | Out-File -FilePath $outFile -Encoding utf8
Write-Host "Wrote results to $outFile"
$okCount = ($results | Where-Object { $_.ok -eq $true }).Count
$failCount = ($results | Where-Object { $_.ok -ne $true }).Count
Write-Host "$okCount succeeded, $failCount failed"
