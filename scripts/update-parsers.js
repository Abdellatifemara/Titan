const fs = require('fs');
const path = require('path');

// New log data from 26-01-27--17-33--Yearog--Icecrown
const LOG_ID = '26-01-27--17-33--Yearog--Icecrown';
const LOG_DATE = '2026-01-27';

// Player class mapping (detected from the log)
const playerClasses = {
    'Nyc': 'Warrior',
    'Yearog': 'Rogue',
    'Pillarman': 'Mage',
    'Cannabiszl': 'Mage',
    'Waawaapriest': 'Priest',
    'Ritamnereda': 'Death Knight',
    'Feralforte': 'Druid',
    'Neonate': 'Warrior',
    'Panetone': 'Druid',
    'Devilheal': 'Priest',
    'Ninepieces': 'Rogue',
    'Mecyhunt': 'Hunter',
    'Peacheas': 'Paladin',
    'Strangedude': 'Death Knight',
    'Taurenirl': 'Paladin',
    'Snipdk': 'Death Knight',
    'Manbearcatz': 'Druid',
    'Destroll': 'Warrior',
    'Kidcovid': 'Warlock',
    'Cylaxh': 'Hunter',
    'Brigata': 'Paladin',
    'Plaguebound': 'Death Knight',
    'Moreholy': 'Priest',
    // 'Atreffinha': 'Shaman', // Healer - excluded from DPS
    'Personalgym': 'Priest',
    'BrigataA': 'Rogue'
};

// Boss DPS data (top 10 per boss, excluding tanks/healers with low DPS)
const bossData = {
    'Lord Marrowgar': [
        { player: 'Nyc', dps: 24206.1 },
        { player: 'Yearog', dps: 21745.8 },
        { player: 'Pillarman', dps: 20252.2 },
        { player: 'Cannabiszl', dps: 19492.8 },
        { player: 'Waawaapriest', dps: 18699.9 },
        { player: 'Ritamnereda', dps: 17671.0 },
        { player: 'Feralforte', dps: 17050.4 },
        { player: 'Neonate', dps: 16946.3 },
        { player: 'Panetone', dps: 16744.6 },
        { player: 'Devilheal', dps: 16134.4 }
    ],
    'Lady Deathwhisper': [
        { player: 'Nyc', dps: 18255.3 },
        { player: 'Atreffinha', dps: 17858.8 },
        { player: 'Cannabiszl', dps: 16782.6 },
        { player: 'Devilheal', dps: 14930.3 },
        { player: 'Taurenirl', dps: 14879.9 },
        { player: 'Yearog', dps: 14711.4 },
        { player: 'Peacheas', dps: 14624.1 },
        { player: 'Pillarman', dps: 14315.2 },
        { player: 'Strangedude', dps: 14081.3 },
        { player: 'Ritamnereda', dps: 14050.3 }
    ],
    'Deathbringer Saurfang': [
        // Total damage / 121s fight duration
        { player: 'Pillarman', dps: 22516.7 },
        { player: 'Yearog', dps: 21711.7 },
        { player: 'Nyc', dps: 21682.0 },
        { player: 'Neonate', dps: 21176.1 },
        { player: 'Cannabiszl', dps: 21009.8 },
        { player: 'Snipdk', dps: 19781.0 },
        { player: 'Panetone', dps: 19760.7 },
        { player: 'Devilheal', dps: 19132.3 },
        { player: 'Ritamnereda', dps: 18400.6 },
        { player: 'Waawaapriest', dps: 17621.2 }
    ],
    'Rotface': [
        { player: 'Nyc', dps: 21042.4 },
        { player: 'Pillarman', dps: 20409.2 },
        { player: 'Yearog', dps: 20172.2 },
        { player: 'Neonate', dps: 19235.8 },
        { player: 'Snipdk', dps: 18587.7 },
        { player: 'Waawaapriest', dps: 18135.0 },
        { player: 'Devilheal', dps: 17849.7 },
        { player: 'Panetone', dps: 17550.6 },
        { player: 'Ritamnereda', dps: 17423.8 },
        { player: 'Peacheas', dps: 16730.6 }
    ],
    'Festergut': [
        { player: 'Nyc', dps: 21553.3 },
        { player: 'Pillarman', dps: 20517.1 },
        { player: 'Snipdk', dps: 18033.6 },
        { player: 'Cannabiszl', dps: 17854.8 },
        { player: 'Ritamnereda', dps: 17748.8 },
        { player: 'Yearog', dps: 17572.3 },
        { player: 'Panetone', dps: 17086.7 },
        { player: 'Devilheal', dps: 17013.5 },
        { player: 'Ninepieces', dps: 16941.6 },
        { player: 'Taurenirl', dps: 16723.5 }
    ],
    'Professor Putricide': [
        { player: 'Cannabiszl', dps: 17605.6 },
        { player: 'Nyc', dps: 17342.8 },
        { player: 'Devilheal', dps: 16380.0 },
        { player: 'Pillarman', dps: 15963.7 },
        { player: 'Waawaapriest', dps: 15257.2 },
        { player: 'Ritamnereda', dps: 15082.5 },
        { player: 'Neonate', dps: 14832.8 },
        { player: 'Snipdk', dps: 14502.0 },
        { player: 'Taurenirl', dps: 14455.8 },
        { player: 'Feralforte', dps: 13939.7 }
    ],
    'Blood Prince Council': [
        { player: 'Pillarman', dps: 15603.6 },
        { player: 'Devilheal', dps: 15269.0 },
        { player: 'Cannabiszl', dps: 14682.3 },
        { player: 'Panetone', dps: 13364.3 },
        { player: 'Feralforte', dps: 13174.9 },
        { player: 'Snipdk', dps: 12351.7 },
        { player: 'Ritamnereda', dps: 12172.1 },
        { player: 'Waawaapriest', dps: 10547.7 },
        { player: 'Manbearcatz', dps: 10519.2 },
        { player: 'Kidcovid', dps: 9868.0 }
    ],
    "Blood-Queen Lana'thel": [
        { player: 'Nyc', dps: 37251.1 },
        { player: 'Atreffinha', dps: 30880.0 },
        { player: 'Cannabiszl', dps: 29614.1 },
        { player: 'Manbearcatz', dps: 19862.9 },
        { player: 'Pillarman', dps: 18583.3 },
        { player: 'Waawaapriest', dps: 17145.3 },
        { player: 'Devilheal', dps: 16939.6 },
        { player: 'Yearog', dps: 16648.6 },
        { player: 'Snipdk', dps: 16197.6 },
        { player: 'Neonate', dps: 15930.7 }
    ],
    'Sindragosa': [
        { player: 'Nyc', dps: 15467.3 },
        { player: 'Pillarman', dps: 14493.1 },
        { player: 'Feralforte', dps: 13218.8 },
        { player: 'Yearog', dps: 12382.9 },
        { player: 'Snipdk', dps: 12021.6 },
        { player: 'Waawaapriest', dps: 11648.5 },
        { player: 'Mecyhunt', dps: 10728.6 },
        { player: 'Strangedude', dps: 10640.0 },
        { player: 'Ritamnereda', dps: 10373.6 },
        { player: 'Cylaxh', dps: 10224.1 }
    ],
    'The Lich King': [
        { player: 'Nyc', dps: 17529.2 },
        { player: 'Pillarman', dps: 14126.9 },
        { player: 'Yearog', dps: 14015.2 },
        { player: 'Cannabiszl', dps: 13720.6 },
        { player: 'Feralforte', dps: 12269.3 },
        { player: 'Taurenirl', dps: 12164.1 },
        { player: 'Snipdk', dps: 11985.1 },
        { player: 'Panetone', dps: 11743.9 },
        { player: 'Waawaapriest', dps: 11728.7 },
        { player: 'Neonate', dps: 11559.8 }
    ]
};

// Load existing data
const dataPath = path.join(__dirname, '..', 'data', 'top-parsers.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

let updatesCount = 0;

// Update each boss
for (const [bossName, players] of Object.entries(bossData)) {
    if (!data.dps[bossName]) {
        console.log(`Boss "${bossName}" not found in data, skipping...`);
        continue;
    }

    const bossEntry = data.dps[bossName];

    for (const { player, dps } of players) {
        const playerClass = playerClasses[player];
        if (!playerClass) {
            console.log(`Unknown class for player ${player}, skipping...`);
            continue;
        }

        const record = {
            player,
            class: playerClass,
            dps: Math.round(dps * 10) / 10,
            date: LOG_DATE,
            logId: LOG_ID
        };

        // Check if beats best overall
        if (dps > bossEntry.bestOverall.dps) {
            console.log(`NEW BEST OVERALL: ${bossName} - ${player} (${playerClass}) ${dps.toFixed(1)} DPS (was ${bossEntry.bestOverall.dps} by ${bossEntry.bestOverall.player})`);
            bossEntry.bestOverall = record;
            updatesCount++;
        }

        // Check if beats best for class
        if (!bossEntry.bestByClass[playerClass] || dps > bossEntry.bestByClass[playerClass].dps) {
            const old = bossEntry.bestByClass[playerClass];
            if (old) {
                console.log(`NEW BEST ${playerClass}: ${bossName} - ${player} ${dps.toFixed(1)} DPS (was ${old.dps} by ${old.player})`);
            } else {
                console.log(`FIRST ${playerClass}: ${bossName} - ${player} ${dps.toFixed(1)} DPS`);
            }
            bossEntry.bestByClass[playerClass] = record;
            updatesCount++;
        }

        // Update top performances
        const existingIdx = bossEntry.topPerformances.findIndex(p => p.player === player);
        if (existingIdx !== -1) {
            if (dps > bossEntry.topPerformances[existingIdx].dps) {
                bossEntry.topPerformances[existingIdx] = record;
            }
        } else {
            // Check if should be added to top 10
            if (bossEntry.topPerformances.length < 10 || dps > bossEntry.topPerformances[bossEntry.topPerformances.length - 1].dps) {
                bossEntry.topPerformances.push(record);
                bossEntry.topPerformances.sort((a, b) => b.dps - a.dps);
                bossEntry.topPerformances = bossEntry.topPerformances.slice(0, 10);
            }
        }
    }
}

// Update metadata
data.totalLogs = (data.totalLogs || 26) + 1;
data.dateRange.to = LOG_DATE;
data.generated = new Date().toISOString();

// Save updated data
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log(`\n=== SUMMARY ===`);
console.log(`Total updates: ${updatesCount}`);
console.log(`Total logs: ${data.totalLogs}`);
console.log(`Date range: ${data.dateRange.from} to ${data.dateRange.to}`);
