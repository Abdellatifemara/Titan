$content = Get-Content 'c:\Users\pc\Desktop\G\wawaa\guild.html' -Raw

# Find the start of staticMembers array
$startPattern = "// Static fallback data - Full 852 member roster from Warmane API`r?`n\s+const staticMembers = \["
$endPattern = "\];`r?`n`r?`n\s+// Fetch guild members"

# Replace the array with a comment pointing to external file
$replacement = "// Static members loaded from guild-data.js (831 level 80 members)`n`n        // Fetch guild members"

$newContent = $content -replace "(?s)// Static fallback data.*?\];(\r?\n)+(\s+)// Fetch guild members", $replacement

$newContent | Out-File 'c:\Users\pc\Desktop\G\wawaa\guild.html' -Encoding UTF8 -NoNewline

Write-Host "Updated guild.html - removed inline staticMembers array"
