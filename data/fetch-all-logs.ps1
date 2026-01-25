# Script to fetch all UwU logs data
# Run this script to download all raid log data

$logUrls = @(
    "https://uwu-logs.xyz/reports/25-08-30--10-40--Ellenorxo--Icecrown/",
    "https://uwu-logs.xyz/reports/25-08-30--22-36--Cwelniczka--Icecrown/",
    "https://uwu-logs.xyz/reports/25-08-31--02-28--Axamuk--Icecrown/",
    "https://uwu-logs.xyz/reports/25-08-31--18-22--Exuberantt--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-02--03-57--Serko--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-04--21-41--Slicee--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-04--20-03--Ellenorqt--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-06--03-10--Pyrogenic--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-06--01-57--Cwelmaker--Icecrown",
    "https://uwu-logs.xyz/reports/25-09-07--00-20--Exuberantt--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-07--23-54--Hydrogeddon--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-08--01-57--Stoles--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-08--15-57--Obeythegodx--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-08--14-49--Riperdemo--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-09--02-53--Theserk--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-09--22-08--Serksham--Icecrown",
    "https://uwu-logs.xyz/reports/25-09-10--14-38--Meekk--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-11--01-18--Gladiox--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-10--20-00--Ellenor--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-11--22-07--Eclipzz--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-11--18-48--Ellenorxo--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-13--02-02--Obeythegodx--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-14--01-50--Serksham--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-15--23-36--Acidhunts--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-15--23-52--Goonpa--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-16--16-58--Exuberantt--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-17--17-35--Ellenorp--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-18--17-33--Ellenorxo--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-19--22-22--Acidhunts--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-21--02-51--Gladiox--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-22--03-36--Serkwarrtwo--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-24--01-25--Shitdamage--Icecrown",
    "https://uwu-logs.xyz/reports/25-09-25--00-25--Aciddudu--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-25--19-02--Betametazona--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-26--02-29--Obeythegodx--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-26--17-31--Ellenor--Icecrown/",
    "https://uwu-logs.xyz/reports/25-09-28--00-00--Acidhunts--Icecrown/",
    "https://uwu-logs.xyz/reports/25-10-03--00-31--Notframez--Icecrown/",
    "https://uwu-logs.xyz/reports/25-10-04--02-20--Serkwarrtwo--Icecrown/",
    "https://uwu-logs.xyz/reports/25-10-05--02-51--Serkclipse--Icecrown/",
    "https://uwu-logs.xyz/reports/25-10-06--01-34--Ephemera--Icecrown/",
    "https://uwu-logs.xyz/reports/25-10-07--00-26--Shibonator--Icecrown",
    "https://uwu-logs.xyz/reports/25-10-08--03-06--Obeythegodx--Icecrown/",
    "https://uwu-logs.xyz/reports/25-10-09--03-14--Serkclipse--Icecrown/",
    "https://uwu-logs.xyz/reports/25-10-09--19-26--Acidhunts--Icecrown/",
    "https://uwu-logs.xyz/reports/25-10-10--01-23--Gladiox--Icecrown/",
    "https://uwu-logs.xyz/reports/25-10-14--03-41--Serksham--Icecrown/",
    "https://uwu-logs.xyz/reports/25-10-16--04-18--Serko--Icecrown/",
    "https://uwu-logs.xyz/reports/25-10-16--20-14--Serkboomkin--Icecrown/",
    "https://uwu-logs.xyz/reports/25-10-21--19-27--Serkwarr--Icecrown/",
    "https://uwu-logs.xyz/reports/25-10-22--00-12--Serkwarrtwo--Icecrown/",
    "https://uwu-logs.xyz/reports/25-10-25--23-39--Serkwarrtwo--Icecrown",
    "https://uwu-logs.xyz/reports/25-10-26--17-21--Exuberantt--Icecrown/",
    "https://uwu-logs.xyz/reports/25-10-27--19-14--Serkwarr--Icecrown/",
    "https://uwu-logs.xyz/reports/25-10-29--23-54--Goonpa--Icecrown/",
    "https://uwu-logs.xyz/reports/25-11-01--01-22--Shibonator--Icecrown/",
    "https://uwu-logs.xyz/reports/25-11-02--00-11--Serkwarrtwo--Icecrown/",
    "https://uwu-logs.xyz/reports/25-11-02--20-47--Robotalian--Icecrown/",
    "https://uwu-logs.xyz/reports/25-11-02--19-38--Acidpala--Icecrown/",
    "https://uwu-logs.xyz/reports/25-11-04--14-44--Shortstacks--Icecrown/",
    "https://uwu-logs.xyz/reports/25-11-04--22-03--Serkwarr--Icecrown/",
    "https://uwu-logs.xyz/reports/25-11-05--01-46--Exuberantt--Icecrown/",
    "https://uwu-logs.xyz/reports/25-11-05--23-12--Serkclipse--Icecrown/",
    "https://uwu-logs.xyz/reports/25-11-07--01-33--Gladiox--Icecrown/",
    "https://uwu-logs.xyz/reports/25-11-07--17-18--Serkwarrtwo--Icecrown/",
    "https://uwu-logs.xyz/reports/25-11-10--02-48--Robotalian--Icecrown/",
    "https://uwu-logs.xyz/reports/25-11-16--00-39--Serkwarr--Icecrown/",
    "https://uwu-logs.xyz/reports/25-11-24--02-25--Firecopx--Icecrown/",
    "https://uwu-logs.xyz/reports/25-11-25--04-01--Shadowcopx--Icecrown/",
    "https://uwu-logs.xyz/reports/25-11-26--01-59--Serkclipse--Icecrown/",
    "https://uwu-logs.xyz/reports/25-11-26--02-43--Shibonator--Icecrown/",
    "https://uwu-logs.xyz/reports/25-11-26--03-27--Serkwarr--Icecrown/",
    "https://uwu-logs.xyz/reports/25-11-26--16-57--Serkwarr--Icecrown/",
    "https://uwu-logs.xyz/reports/25-11-27--01-04--Sugarlips--Icecrown/",
    "https://uwu-logs.xyz/reports/25-12-01--23-55--Shibonator--Icecrown/",
    "https://uwu-logs.xyz/reports/25-12-03--19-24--Serkwarr--Icecrown/",
    "https://uwu-logs.xyz/reports/25-12-03--20-02--Serko--Icecrown/",
    "https://uwu-logs.xyz/reports/25-12-10--17-06--Magxe--Icecrown/",
    "https://uwu-logs.xyz/reports/25-12-13--01-45--Serko--Icecrown/",
    "https://uwu-logs.xyz/reports/25-12-20--23-13--Meekk--Icecrown/",
    "https://uwu-logs.xyz/reports/25-12-22--00-27--Serkwarr--Icecrown/",
    "https://uwu-logs.xyz/reports/25-12-24--22-43--Hiroshiima--Icecrown/",
    "https://uwu-logs.xyz/reports/25-12-26--01-28--Tdibiswarry--Icecrown/",
    "https://uwu-logs.xyz/reports/25-12-28--00-01--Teatairova--Icecrown/",
    "https://uwu-logs.xyz/reports/25-12-28--23-34--Spread--Icecrown/",
    "https://uwu-logs.xyz/reports/25-12-28--19-12--Ellenor--Icecrown/",
    "https://uwu-logs.xyz/reports/25-12-30--00-11--Goonpa--Icecrown/",
    "https://uwu-logs.xyz/reports/25-12-31--00-00--Serkwarrtwo--Icecrown/",
    "https://uwu-logs.xyz/reports/26-01-01--02-34--Serkwarr--Icecrown/",
    "https://uwu-logs.xyz/reports/26-01-02--00-33--Exuberantt--Icecrown/",
    "https://uwu-logs.xyz/reports/26-01-02--01-31--Nerfmycurse--Icecrown/",
    "https://uwu-logs.xyz/reports/26-01-03--00-14--Teatairova--Icecrown/",
    "https://uwu-logs.xyz/reports/26-01-03--23-58--Betametazona--Icecrown/",
    "https://uwu-logs.xyz/reports/26-01-05--00-59--Healbill--Icecrown/",
    "https://uwu-logs.xyz/reports/26-01-05--23-30--Meekk--Icecrown/",
    "https://uwu-logs.xyz/reports/26-01-09--00-10--Txmmy--Icecrown/",
    "https://uwu-logs.xyz/reports/26-01-11--17-50--Ellenorxo--Icecrown/",
    "https://uwu-logs.xyz/reports/26-01-14--18-23--Serkwarr--Icecrown/",
    "https://uwu-logs.xyz/reports/26-01-14--16-51--Betzyd--Icecrown/",
    "https://uwu-logs.xyz/reports/26-01-14--18-09--Murmelecke--Icecrown/",
    "https://uwu-logs.xyz/reports/26-01-17--22-25--Serko--Icecrown/",
    "https://uwu-logs.xyz/reports/26-01-18--22-10--Robotalian--Icecrown/"
)

Write-Host "Total logs to fetch: $($logUrls.Count)"
Write-Host "Starting download..."

$outputDir = "c:\Users\pc\Desktop\G\wawaa\data\logs"
if (!(Test-Path $outputDir)) {
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
        Start-Sleep -Milliseconds 500
    }
    catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
        # Longer delay on error
        Start-Sleep -Seconds 2
    }
}

Write-Host "`nDone! Downloaded $counter logs to $outputDir"
