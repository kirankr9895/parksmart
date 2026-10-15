Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   ParkSmart - Push to GitHub (kirankr9895)" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Target Remote: https://github.com/kirankr9895/parksmart.git" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pushing main branch..." -ForegroundColor White

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "View your repository at: https://github.com/kirankr9895/parksmart" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "⚠️ Push encountered an issue." -ForegroundColor Yellow
    Write-Host "If the repository doesn't exist yet on GitHub:" -ForegroundColor White
    Write-Host "1. Go to: https://github.com/new" -ForegroundColor White
    Write-Host "2. Name: parksmart (Leave 'Initialize with README' UNCHECKED)" -ForegroundColor White
    Write-Host "3. Click 'Create repository'" -ForegroundColor White
    Write-Host "4. Re-run this script!" -ForegroundColor White
}
Write-Host ""
pause
