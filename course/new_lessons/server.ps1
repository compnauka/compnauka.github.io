$ErrorActionPreference = "Stop"

$port = 4173
$root = "C:\Users\artem\Documents\GitHub\itnauka.org\course\new_lessons"
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
$listener.Start()

function Get-ContentType([string]$path) {
  switch ([System.IO.Path]::GetExtension($path).ToLowerInvariant()) {
    ".html" { return "text/html; charset=utf-8" }
    ".css" { return "text/css; charset=utf-8" }
    ".js" { return "text/javascript; charset=utf-8" }
    ".json" { return "application/json; charset=utf-8" }
    ".svg" { return "image/svg+xml" }
    default { return "application/octet-stream" }
  }
}

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = $reader.ReadLine()
      if ([string]::IsNullOrWhiteSpace($requestLine)) { continue }

      while ($reader.ReadLine() -ne "") { }

      $parts = $requestLine.Split(" ")
      $rawPath = if ($parts.Length -ge 2) { $parts[1] } else { "/" }
      $path = $rawPath.Split("?")[0].TrimStart("/")
      if ([string]::IsNullOrWhiteSpace($path)) { $path = "index.html" }
      $safePath = $path -replace "/", "\"
      $fullPath = Join-Path $root $safePath

      if ((Test-Path $fullPath) -and -not (Get-Item $fullPath).PSIsContainer) {
        $bytes = [System.IO.File]::ReadAllBytes($fullPath)
        $headers = "HTTP/1.1 200 OK`r`nContent-Type: $(Get-ContentType $fullPath)`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
        $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
        $stream.Write($headerBytes, 0, $headerBytes.Length)
        $stream.Write($bytes, 0, $bytes.Length)
      } else {
        $body = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
        $headers = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
        $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
        $stream.Write($headerBytes, 0, $headerBytes.Length)
        $stream.Write($body, 0, $body.Length)
      }
    } finally {
      if ($stream) { $stream.Close() }
      $client.Close()
    }
  }
} finally {
  $listener.Stop()
}
