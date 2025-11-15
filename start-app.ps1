# Start Expo from the correct directory
Set-Location C:\Projects\Engram
Write-Host "Starting Expo from: $(Get-Location)" -ForegroundColor Green
npx expo start --clear
