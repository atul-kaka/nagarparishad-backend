# PowerShell script to find WinACME certificate files
# Run this script to locate your SSL certificate files

Write-Host "Searching for WinACME certificate files..." -ForegroundColor Cyan
Write-Host ""

# Common WinACME locations
$locations = @(
    "C:\ProgramData\win-acme\httpsacme-v02.api.letsencrypt.org\api.kaamlo.com",
    "$env:LOCALAPPDATA\win-acme\httpsacme-v02.api.letsencrypt.org\api.kaamlo.com",
    "$env:USERPROFILE\AppData\Local\win-acme\httpsacme-v02.api.letsencrypt.org\api.kaamlo.com"
)

$found = $false

foreach ($location in $locations) {
    if (Test-Path $location) {
        Write-Host "Found certificate directory: $location" -ForegroundColor Green
        Write-Host ""
        
        # List all files
        $files = Get-ChildItem -Path $location -File
        if ($files.Count -gt 0) {
            Write-Host "Certificate files found:" -ForegroundColor Yellow
            foreach ($file in $files) {
                Write-Host "  - $($file.Name) ($([math]::Round($file.Length/1KB, 2)) KB)" -ForegroundColor White
            }
            Write-Host ""
            
            # Check for certificate files
            $fullchain = $files | Where-Object { $_.Name -like "*fullchain*" -or $_.Name -like "*chain*" }
            $privkey = $files | Where-Object { $_.Name -like "*privkey*" -or $_.Name -like "*key*" -and $_.Name -notlike "*pub*" }
            
            if ($fullchain -and $privkey) {
                Write-Host "Certificate files detected:" -ForegroundColor Green
                Write-Host "  Fullchain: $($fullchain.FullName)" -ForegroundColor Cyan
                Write-Host "  Private Key: $($privkey.FullName)" -ForegroundColor Cyan
                Write-Host ""
                
                Write-Host "Nginx configuration paths:" -ForegroundColor Yellow
                $nginxFullchain = $fullchain.FullName -replace '\\', '/'
                $nginxPrivkey = $privkey.FullName -replace '\\', '/'
                Write-Host "  ssl_certificate $nginxFullchain;" -ForegroundColor White
                Write-Host "  ssl_certificate_key $nginxPrivkey;" -ForegroundColor White
                Write-Host ""
                
                $found = $true
            } else {
                Write-Host "Warning: Could not find fullchain or privkey files" -ForegroundColor Yellow
            }
        } else {
            Write-Host "Directory exists but is empty" -ForegroundColor Yellow
        }
        Write-Host ""
    }
}

if (-not $found) {
    Write-Host "Certificate files not found in common locations." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "1. WinACME settings for certificate storage location" -ForegroundColor White
    Write-Host "2. The folder where you ran WinACME" -ForegroundColor White
    Write-Host "3. Search manually: Get-ChildItem -Path C:\ -Recurse -Filter '*api.kaamlo.com*' -ErrorAction SilentlyContinue" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

