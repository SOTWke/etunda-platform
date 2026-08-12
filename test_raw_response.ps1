Write-Host "=== Detailed response check ===" -ForegroundColor Green
$body = @{email="testuser1@example.com"; password="password123"; role="buyer"} | ConvertTo-Json

$request = [System.Net.HttpWebRequest]::Create("http://localhost:5000/api/auth/register")
$request.Method = "POST"
$request.ContentType = "application/json"

$stream = [System.IO.MemoryStream]::new()
$writer = [System.IO.StreamWriter]::new($stream)
$writer.Write($body)
$writer.Flush()
$stream.Position = 0
$request.ContentLength = $stream.Length

$reqStream = $request.GetRequestStream()
$stream.CopyTo($reqStream)
$reqStream.Close()

try {
    $response = $request.GetResponse()
    Write-Host "Status: $($response.StatusCode)"
} catch [System.Net.WebException] {
    $response = $_.Exception.Response
    Write-Host "Status: $($response.StatusCode)"
}

if ($response) {
    $respStream = $response.GetResponseStream()
    $reader = [System.IO.StreamReader]::new($respStream)
    $content = $reader.ReadToEnd()
    Write-Host "Content-Type: $($response.ContentType)"
    Write-Host "Content Length: $($content.Length)"
    Write-Host "Content: $content"
    $reader.Close()
    $respStream.Close()
}
$response.Close()
