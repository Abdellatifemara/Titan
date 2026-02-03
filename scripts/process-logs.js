const https = require('https');
const fs = require('fs');
const path = require('path');

// Load existing top-parsers
const dataPath = path.join(__dirname, '..', 'data', 'top-parsers.json');
const topParsers = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const BOSSES = [
    'lord-marrowgar',
    'lady-deathwhisper',
    'deathbringer-saurfang',
    'rotface',
    'festergut',
    'professor-putricide',
    'blood-prince-council',
    'blood-queen-lanathel',
    'sindragosa',
    'the-lich-king'
];

const BOSS_NAMES = {
    'lord-marrowgar': 'Lord Marrowgar',
    'lady-deathwhisper': 'Lady Deathwhisper',
    'deathbringer-saurfang': 'Deathbringer Saurfang',
    'rotface': 'Rotface',
    'festergut': 'Festergut',
    'professor-putricide': 'Professor Putricide',
    'blood-prince-council': 'Blood Prince Council',
    'blood-queen-lanathel': 'Blood-Queen Lana\'thel',
    'sindragosa': 'Sindragosa',
    'the-lich-king': 'The Lich King'
};

// Healer specs to ignore
const HEALER_SPECS = [
    'Restoration Shaman', 'Restoration Druid', 'Holy Paladin',
    'Holy Priest', 'Discipline Priest', 'Protection Paladin',
    'Protection Warrior', 'Blood Death Knight', 'Feral Combat Druid'
];

// Tank specs - we keep feral DPS but exclude bear tanks
const TANK_SPECS = ['Protection Paladin', 'Protection Warrior', 'Blood Death Knight'];

function getClassFromSpec(spec) {
    if (spec.includes('Warrior')) return 'Warrior';
    if (spec.includes('Mage')) return 'Mage';
    if (spec.includes('Rogue')) return 'Rogue';
    if (spec.includes('Warlock')) return 'Warlock';
    if (spec.includes('Druid')) return 'Druid';
    if (spec.includes('Hunter')) return 'Hunter';
    if (spec.includes('Death Knight')) return 'Death Knight';
    if (spec.includes('Paladin')) return 'Paladin';
    if (spec.includes('Priest')) return 'Priest';
    if (spec.includes('Shaman')) return 'Shaman';
    return 'Unknown';
}

function isDPS(spec) {
    // Exclude healers and tanks
    if (HEALER_SPECS.includes(spec)) return false;
    if (TANK_SPECS.includes(spec)) return false;
    // Check for tank-related specs
    if (spec.includes('Restoration')) return false;
    if (spec.includes('Holy')) return false;
    if (spec.includes('Discipline')) return false;
    if (spec.includes('Protection')) return false;
    if (spec === 'Blood Death Knight') return false;
    return true;
}

function fetchBossData(logId, boss, attempt) {
    return new Promise((resolve, reject) => {
        const url = `https://uwu-logs.xyz/reports/${logId}/?boss=${boss}&mode=25H&attempt=${attempt}`;

        https.get(url, (res) => {
            let html = '';
            res.on('data', chunk => html += chunk);
            res.on('end', () => {
                const rowRegex = /<tr[^>]*>[\s\S]*?<td[^>]*class="player-cell"[^>]*title="([^"]+)"[\s\S]*?<a[^>]*>([^<]+)<\/a>[\s\S]*?<td class="useful total-cell">([^<]+)<\/td>\s*<td class="useful per-sec-cell">([^<]+)<\/td>[\s\S]*?<\/tr>/gi;

                let match;
                const players = [];

                while ((match = rowRegex.exec(html)) !== null) {
                    const spec = match[1].trim();
                    const name = match[2].trim();

                    if (name === 'Total') continue;
                    if (!isDPS(spec)) continue;

                    const usefulDmg = match[3].trim().replace(/\s/g, '');
                    const usefulDps = match[4].trim().replace(/\s/g, '');

                    players.push({
                        name,
                        spec,
                        class: getClassFromSpec(spec),
                        damage: parseInt(usefulDmg),
                        dps: parseFloat(usefulDps)
                    });
                }

                players.sort((a, b) => b.dps - a.dps);
                resolve(players);
            });
        }).on('error', reject);
    });
}

async function processLog(logId, bossAttempts) {
    const date = logId.split('--')[0].replace(/-/g, '-');
    const formattedDate = `2026-${date.substring(0,2)}-${date.substring(3,5)}`;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Processing: ${logId}`);
    console.log(`Date: ${formattedDate}`);
    console.log(`${'='.repeat(60)}`);

    const newRecords = [];

    for (const boss of BOSSES) {
        const attempt = bossAttempts[boss] || '0';
        const bossName = BOSS_NAMES[boss];

        try {
            const players = await fetchBossData(logId, boss, attempt);

            if (players.length === 0) {
                console.log(`\n${bossName}: No data found (might be wipe or missing)`);
                continue;
            }

            console.log(`\n${bossName}:`);

            const currentBest = topParsers.dps[bossName]?.bestOverall?.dps || 0;
            const top5 = players.slice(0, 5);

            top5.forEach((p, i) => {
                const isRecord = p.dps > currentBest;
                const marker = isRecord ? ' *** NEW OVERALL RECORD ***' : '';
                console.log(`  ${i+1}. ${p.name} (${p.spec}) - ${p.dps.toFixed(1)} DPS${marker}`);
            });

            // Check for class records
            const classBests = topParsers.dps[bossName]?.bestByClass || {};

            for (const player of players) {
                const classRecord = classBests[player.class]?.dps || 0;

                if (player.dps > classRecord) {
                    console.log(`  >>> NEW ${player.class.toUpperCase()} RECORD: ${player.name} - ${player.dps.toFixed(1)} DPS (prev: ${classRecord.toFixed(1)})`);
                    newRecords.push({
                        boss: bossName,
                        player: player.name,
                        class: player.class,
                        dps: player.dps,
                        prevRecord: classRecord,
                        logId,
                        date: formattedDate,
                        type: player.dps > currentBest ? 'overall+class' : 'class'
                    });
                }
            }

        } catch (err) {
            console.log(`\n${bossName}: Error - ${err.message}`);
        }
    }

    return newRecords;
}

async function main() {
    const logs = [
        {
            id: '26-02-02--15-22--Waawaabomka--Icecrown',
            attempts: {} // all attempt 0
        },
        {
            id: '26-01-31--15-08--Waawa--Icecrown',
            attempts: {} // all attempt 0
        },
        {
            id: '26-02-02--17-37--Orckhan--Icecrown',
            attempts: {
                'lady-deathwhisper': '1',
                'sindragosa': '1',
                'the-lich-king': '1'
            }
        }
    ];

    const allNewRecords = [];

    for (const log of logs) {
        const records = await processLog(log.id, log.attempts);
        allNewRecords.push(...records);
    }

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY OF NEW RECORDS');
    console.log('='.repeat(60));

    if (allNewRecords.length === 0) {
        console.log('No new records found.');
    } else {
        allNewRecords.forEach(r => {
            console.log(`${r.boss}: ${r.player} (${r.class}) - ${r.dps.toFixed(1)} DPS [${r.type}]`);
        });
    }

    // Save records to file for review
    fs.writeFileSync(
        path.join(__dirname, 'new-records.json'),
        JSON.stringify(allNewRecords, null, 2)
    );
    console.log('\nRecords saved to scripts/new-records.json');
}

main().catch(console.error);
