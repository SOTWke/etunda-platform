# Test 1: Farmer registration
Write-Host "Test 1: Farmer registration" -ForegroundColor Yellow
$body = @{email="farmer.test@example.com"; password="secure123"; role="farmer"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri http://localhost:5000/api/auth/register -Method POST -ContentType "application/json" -Body $body
$data = $r.Content | ConvertFrom-Json
Write-Host ("Status: " + $r.StatusCode + " | Email: " + $data.user.email + " | Role: " + $data.user.role)
Write-Host ""

# Test 2: Duplicate email registration
Write-Host "Test 2: Duplicate email (should fail 409)" -ForegroundColor Yellow
$body = @{email="farmer.test@example.com"; password="secure123"; role="buyer"} | ConvertTo-Json
try {
    $r = Invoke-WebRequest -Uri http://localhost:5000/api/auth/register -Method POST -ContentType "application/json" -Body $body
} catch {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = [System.IO.StreamReader]::new($stream)
    $content = $reader.ReadToEnd()
    $parsed = $content | ConvertFrom-Json
    Write-Host ("Status: Conflict (409) | Message: " + $parsed.error)
    $reader.Close()
}
Write-Host ""

# Test 3: Login with correct password
Write-Host "Test 3: Login with correct password" -ForegroundColor Yellow
$body = @{email="farmer.test@example.com"; password="secure123"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri http://localhost:5000/api/auth/login -Method POST -ContentType "application/json" -Body $body
$data = $r.Content | ConvertFrom-Json
$token = $data.token
Write-Host ("Status: " + $r.StatusCode + " | Email: " + $data.user.email + " | Role: " + $data.user.role)
Write-Host ""

# Test 4: Login with wrong password
Write-Host "Test 4: Login with wrong password" -ForegroundColor Yellow
$body = @{email="farmer.test@example.com"; password="wrongpassword"} | ConvertTo-Json
try {
    $r = Invoke-WebRequest -Uri http://localhost:5000/api/auth/login -Method POST -ContentType "application/json" -Body $body
} catch {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = [System.IO.StreamReader]::new($stream)
    $content = $reader.ReadToEnd()
    $parsed = $content | ConvertFrom-Json
    Write-Host ("Status: Unauthorized (401) | Message: " + $parsed.error)
    $reader.Close()
}
Write-Host ""

# Test 5: Buyer registration
Write-Host "Test 5: Buyer registration" -ForegroundColor Yellow
$body = @{email="buyer.test@example.com"; password="secure123"; role="buyer"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri http://localhost:5000/api/auth/register -Method POST -ContentType "application/json" -Body $body
$data = $r.Content | ConvertFrom-Json
Write-Host ("Status: " + $r.StatusCode + " | Email: " + $data.user.email + " | Role: " + $data.user.role)
Write-Host ""

# Test 6: Database check
Write-Host "Test 6: Database integrity" -ForegroundColor Yellow
docker exec etunda_postgres psql -U postgres -d etunda_db -c "SELECT COUNT(*) as total_users, COUNT(DISTINCT email) as unique_emails FROM users;"
Write-Host ""

# Test 7: User list
Write-Host "Test 7: All users in database" -ForegroundColor Yellow
docker exec etunda_postgres psql -U postgres -d etunda_db -c "SELECT email, role FROM users WHERE email LIKE '%.test@%' OR email LIKE '%.example.com' ORDER BY created_at DESC LIMIT 10;"
