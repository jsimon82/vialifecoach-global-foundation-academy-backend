$proc = Get-NetTCPConnection -LocalPort 5500 -State Listen -ErrorAction SilentlyContinue
if ($proc) {
    Stop-Process -Id $proc.OwningProcess -Force
    Write-Host "Killed old server process"
}
Start-Sleep -Seconds 1
Start-Process -FilePath "node" -ArgumentList "src/server.js" -WorkingDirectory "C:\Users\Admin\Desktop\vialifecoach backend\vialifecoach-academy\backend" -WindowStyle Hidden
Start-Sleep -Seconds 3
Write-Host "Server restarted"
