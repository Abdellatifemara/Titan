const fs = require('fs');
const https = require('https');

// Load guild ranks (956 members with ranks)
const guildRanks = JSON.parse(fs.readFileSync('data/guild-ranks.json', 'utf8'));

console.log('Guild ranks has:', Object.keys(guildRanks).length, 'members');

// Fetch class info from Warmane
const options = {
    hostname: 'armory.warmane.com',
    path: '/api/guild/T%20I%20T%20A%20N/Icecrown/members',
    method: 'GET',
    headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
    }
};

console.log('Fetching class info from Warmane...');

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const roster = json.roster || [];

            console.log('Warmane returned:', roster.length, 'members');

            // Build class lookup from Warmane data
            const classLookup = {};
            roster.forEach(m => {
                classLookup[m.name] = {
                    class: m.class,
                    level: parseInt(m.level) || 80,
                    race: m.race
                };
            });

            // Build complete member list
            const members = [];
            for (const [name, rank] of Object.entries(guildRanks)) {
                const info = classLookup[name] || { class: 'Unknown', level: 80, race: 'Unknown' };
                members.push({
                    name,
                    class: info.class,
                    level: info.level,
                    race: info.race,
                    rank
                });
            }

            // Sort by level desc, then name
            members.sort((a, b) => {
                if (b.level !== a.level) return b.level - a.level;
                return a.name.localeCompare(b.name);
            });

            // Count stats
            const level80 = members.filter(m => m.level === 80).length;
            const unknownClass = members.filter(m => m.class === 'Unknown').length;

            console.log('Total members:', members.length);
            console.log('Level 80:', level80);
            console.log('Unknown class (left guild):', unknownClass);

            // Save to file
            const output = {
                generated: new Date().toISOString(),
                totalMembers: members.length,
                level80Count: level80,
                members
            };

            fs.writeFileSync('data/guild-members.json', JSON.stringify(output, null, 2));
            console.log('Saved to data/guild-members.json');

        } catch(e) {
            console.error('Error:', e.message);
        }
    });
});

req.on('error', e => console.error('Request error:', e.message));
req.end();
