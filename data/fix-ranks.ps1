# Read the current file
$content = Get-Content 'c:\Users\pc\Desktop\G\wawaa\guild-data.js' -Raw

# Known officers and leader
$leader = @('Waawaa')
$officers = @('Waawaasap', 'Cucni', 'Waawaadko', 'Luffytaro', 'Tools', 'Waawa', 'Waawaasham', 'Antiopaa', 'Coming', 'Waawaaholy', 'Waawaameow')

# Fix leader rank
foreach ($name in $leader) {
    $content = $content -replace "name: '$name', class: '([^']+)', level: 80, rank: 4", "name: '$name', class: '`$1', level: 80, rank: 0"
}

# Fix officer ranks
foreach ($name in $officers) {
    $content = $content -replace "name: '$name', class: '([^']+)', level: 80, rank: 4", "name: '$name', class: '`$1', level: 80, rank: 1"
}

$content | Out-File 'c:\Users\pc\Desktop\G\wawaa\guild-data.js' -Encoding UTF8 -NoNewline

Write-Host "Fixed ranks for leader and officers"
