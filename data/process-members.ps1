$json = Get-Content 'c:\Users\pc\Desktop\G\wawaa\data\guild-members-raw.json' | ConvertFrom-Json
$level80 = $json.roster | Where-Object { $_.level -eq '80' }

Write-Host "Total level 80 members: $($level80.Count)"

# Create JavaScript array format
$jsMembers = @()
foreach ($member in $level80) {
    $jsMembers += "{ name: '$($member.name)', class: '$($member.class)', level: 80, rank: 4 }"
}

$jsContent = "const staticMembers = [`n" + ($jsMembers -join ",`n") + "`n];"
$jsContent | Out-File -FilePath 'c:\Users\pc\Desktop\G\wawaa\data\level80-members.js' -Encoding UTF8

Write-Host "Created level80-members.js"
