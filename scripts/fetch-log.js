const https = require('https');

const logId = process.argv[2];
const boss = process.argv[3];
const attempt = process.argv[4] || '0';

if (!logId || !boss) {
    console.log('Usage: node fetch-log.js <logId> <boss> [attempt]');
    console.log('Example: node fetch-log.js 26-01-31--15-08--Waawa--Icecrown blood-prince-council 0');
    process.exit(1);
}

const url = `https://uwu-logs.xyz/reports/${logId}/?boss=${boss}&mode=25H&attempt=${attempt}`;

https.get(url, (res) => {
    let html = '';
    res.on('data', chunk => html += chunk);
    res.on('end', () => {
        // Find table rows with player data
        const rowRegex = /<tr[^>]*>[\s\S]*?<td[^>]*class="player-cell"[^>]*title="([^"]+)"[\s\S]*?<a[^>]*>([^<]+)<\/a>[\s\S]*?<td class="useful total-cell">([^<]+)<\/td>\s*<td class="useful per-sec-cell">([^<]+)<\/td>[\s\S]*?<\/tr>/gi;

        let match;
        const players = [];

        while ((match = rowRegex.exec(html)) !== null) {
            const spec = match[1].trim();
            const name = match[2].trim();
            const usefulDmg = match[3].trim().replace(/\s/g, '');
            const usefulDps = match[4].trim().replace(/\s/g, '');

            players.push({
                name,
                spec,
                damage: parseInt(usefulDmg),
                dps: parseFloat(usefulDps)
            });
        }

        // Sort by DPS
        players.sort((a, b) => b.dps - a.dps);

        console.log(`\n=== ${boss.replace(/-/g, ' ').toUpperCase()} (attempt ${attempt}) ===`);
        console.log(`Log: ${logId}\n`);

        players.forEach((p, i) => {
            console.log(`${i+1}. ${p.name} (${p.spec}) - ${p.dps.toFixed(1)} DPS`);
        });

        console.log('\n--- JSON ---');
        console.log(JSON.stringify(players, null, 2));
    });
}).on('error', err => {
    console.error('Error:', err.message);
});
