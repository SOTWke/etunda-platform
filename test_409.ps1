Write-Host "=== TEST 2b: Duplicate email response body ===" -ForegroundColor Green
$body = @{email="testuser1@example.com"; password="password123"; role="buyer"} | ConvertTo-Json
try {
    $r2 = Invoke-WebRequest -Uri http://localhost:5000/api/auth/register -Method POST -ContentType "application/json" -Body $body
} catch {
    Write-Host "HTTP Status Code: $($_.Exception.Response.StatusCode.value__)"
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $content = $reader.ReadToEnd()
    Write-Host "Response Body: $content"
    $reader.Close()
    if ($content) {
        Write-Host "Parsed: $($content | ConvertFrom-Json | ConvertTo-Json)"
    }
}
