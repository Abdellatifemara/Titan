const fs = require('fs');
const https = require('https');

// Load current guild ranks
const currentRanks = JSON.parse(fs.readFileSync('data/guild-ranks.json', 'utf8'));
const existingNames = new Set(Object.keys(currentRanks));

// Load top parsers data
const topParsers = JSON.parse(fs.readFileSync('data/top-parsers.json', 'utf8'));

// Build player best DPS lookup from top parsers
const playerBestDps = {};
for (const [bossName, bossData] of Object.entries(topParsers.dps || {})) {
    const records = bossData.topPerformances || [];
    for (const record of records) {
        if (!playerBestDps[record.player] || record.dps > playerBestDps[record.player].dps) {
            playerBestDps[record.player] = { dps: record.dps, boss: bossName };
        }
    }
}

console.log('Current ranks file has:', existingNames.size, 'members');
console.log('Players in top parsers:', Object.keys(playerBestDps).length);

// Fetch from Warmane API
const options = {
    hostname: 'armory.warmane.com',
    path: '/api/guild/T%20I%20T%20A%20N/Icecrown/members',
    method: 'GET',
    headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
    }
};

console.log('Fetching from Warmane API...');

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            // Members are in the 'roster' field
            const members = json.roster || [];

            console.log('Warmane API returned:', members.length, 'members');

            // Find level 80 members not in ranks
            const newLvl80 = members.filter(m => parseInt(m.level) === 80 && !existingNames.has(m.name));
            console.log('New level 80 members to add:', newLvl80.length);

            if (newLvl80.length === 0) {
                console.log('\nNo new members to add.');
                return;
            }

            // Add new members as 'Member' rank
            let withDps = 0;
            console.log('\nNew members being added:');
            for (const member of newLvl80) {
                currentRanks[member.name] = 'Member';
                const dpsInfo = playerBestDps[member.name];
                if (dpsInfo) {
                    console.log('*', member.name, '(' + member.class + ') - TOP DPS:', Math.round(dpsInfo.dps), 'on', dpsInfo.boss);
                    withDps++;
                } else {
                    console.log('-', member.name, '(' + member.class + ')');
                }
            }

            console.log('\nTotal new members added:', newLvl80.length);
            console.log('New members with parse data:', withDps);
            console.log('Total members after adding:', Object.keys(currentRanks).length);

            // Save updated file
            fs.writeFileSync('data/guild-ranks.json', JSON.stringify(currentRanks, null, 2));
            console.log('Saved to data/guild-ranks.json');

        } catch(e) {
            console.log('Error parsing API response:', e.message);
        }
    });
});

req.on('error', e => console.log('API Error:', e.message));
req.end();
