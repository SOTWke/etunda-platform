Write-Host "=== TEST 1: Registration with new email ===" -ForegroundColor Green
$body = @{email="testuser2@example.com"; password="password123"; role="farmer"} | ConvertTo-Json
$r1 = Invoke-WebRequest -Uri http://localhost:5000/api/auth/register -Method POST -ContentType "application/json" -Body $body
Write-Host "Status: $($r1.StatusCode)"
Write-Host $r1.Content | ConvertFrom-Json | Select-Object user, token | ConvertTo-Json
Write-Host ""

Write-Host "=== TEST 2: Registration with duplicate email (should return 409) ===" -ForegroundColor Green
$body = @{email="testuser1@example.com"; password="password123"; role="buyer"} | ConvertTo-Json
try {
    $r2 = Invoke-WebRequest -Uri http://localhost:5000/api/auth/register -Method POST -ContentType "application/json" -Body $body
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode)"
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $content = $reader.ReadToEnd()
    Write-Host "Response: $content"
}
Write-Host ""

Write-Host "=== TEST 3: Login with correct password ===" -ForegroundColor Green
$body = @{email="testuser1@example.com"; password="password123"} | ConvertTo-Json
$r3 = Invoke-WebRequest -Uri http://localhost:5000/api/auth/login -Method POST -ContentType "application/json" -Body $body
Write-Host "Status: $($r3.StatusCode)"
$r3.Content | ConvertFrom-Json | Select-Object user | ConvertTo-Json
Write-Host ""

Write-Host "=== TEST 4: Login with incorrect password ===" -ForegroundColor Green
$body = @{email="testuser1@example.com"; password="wrongpassword"} | ConvertTo-Json
try {
    $r4 = Invoke-WebRequest -Uri http://localhost:5000/api/auth/login -Method POST -ContentType "application/json" -Body $body
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode)"
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $content = $reader.ReadToEnd()
    Write-Host "Response: $content"
}
Write-Host ""

Write-Host "=== TEST 5: Buyer registration ===" -ForegroundColor Green
$body = @{email="buyeruser@example.com"; password="password123"; role="buyer"} | ConvertTo-Json
$r5 = Invoke-WebRequest -Uri http://localhost:5000/api/auth/register -Method POST -ContentType "application/json" -Body $body
Write-Host "Status: $($r5.StatusCode)"
$r5.Content | ConvertFrom-Json | Select-Object user | ConvertTo-Json
Write-Host ""

Write-Host "=== TEST 6: Login as buyer ===" -ForegroundColor Green
$body = @{email="buyeruser@example.com"; password="password123"} | ConvertTo-Json
$r6 = Invoke-WebRequest -Uri http://localhost:5000/api/auth/login -Method POST -ContentType "application/json" -Body $body
Write-Host "Status: $($r6.StatusCode)"
$r6.Content | ConvertFrom-Json | Select-Object user | ConvertTo-Json
Write-Host ""

Write-Host "=== TEST 7: Check database integrity ===" -ForegroundColor Green
Write-Host "Checking for duplicate emails..."
docker exec etunda_postgres psql -U postgres -d etunda -c "SELECT COUNT(*), email FROM users GROUP BY email HAVING COUNT(*) > 1;"
Write-Host ""
Write-Host "All users in database:"
docker exec etunda_postgres psql -U postgres -d etunda -c "SELECT id, email, role FROM users ORDER BY created_at;"
