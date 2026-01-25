# Script to fetch all Noxus UwU logs data
# Run this script to download all raid log data for Noxus

# Load the JSON file
$json = Get-Content -Raw -Path "c:/Users/pc/Desktop/G/wawaa/data/noxus/noxus-raid-logs.json" | ConvertFrom-Json
$logUrls = $json.logs.url

Write-Host "Total logs to fetch: $($logUrls.Count)"
Write-Host "Starting download..."

$outputDir = "c:/Users/pc/Desktop/G/wawaa/data/noxus/logs"
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force
}

$allData = @()
$counter = 0

foreach ($url in $logUrls) {
    $counter++
    Write-Host "[$counter/$($logUrls.Count)] Fetching: $url"

    try {
        # Extract log ID from URL
        $logId = ($url -split '/reports/')[1] -replace '/', ''
        $outputFile = Join-Path $outputDir "$logId.html"

        # Download the page
        Invoke-WebRequest -Uri $url -OutFile $outputFile -UseBasicParsing

        Write-Host "  Saved to: $outputFile"

        # Small delay to avoid rate limiting
        Start-Sleep -Seconds 5
    }
    catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
        # Longer delay on error
        Start-Sleep -Seconds 2
    }
}

Write-Host "`nDone! Downloaded $counter logs to $outputDir"
