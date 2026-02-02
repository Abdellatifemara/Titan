const fs = require('fs');
const path = require('path');

const HALION_DATE = '2026-01-28';

// Player classes from logs
const playerClasses = {
    // Outside log players
    'Extetdudu': 'Druid',
    'Ninellisfake': 'Warrior',
    'Oldmb': 'Warrior',
    'Ymortus': 'Warrior',
    'Avaya': 'Paladin',
    // Inside log players
    'Chemtrailsky': 'Rogue',
    'Gnomieta': 'Death Knight',
    'Extetdruid': 'Druid',
    'Straxedix': 'Warlock',
    'Fedeksinjo': 'Warrior'
};

// Halion (Outside) - from log 26-01-28--19-08--Felesminor--Icecrown
// Only top 5 with meaningful damage (didn't die)
const halionOutside = [
    { player: 'Extetdudu', dps: 14546.4 },
    { player: 'Ninellisfake', dps: 14369.6 },
    { player: 'Oldmb', dps: 13613.2 },
    { player: 'Ymortus', dps: 10713.4 },
    { player: 'Avaya', dps: 9623.6 }
];

// Halion (Inside) - best from logs 26-01-28--19-39 and 26-01-28--20-15
// Combined top 5 with meaningful damage
const halionInside = [
    { player: 'Chemtrailsky', dps: 19121.5, logId: '26-01-28--19-39--Absorbs--Icecrown' },
    { player: 'Gnomieta', dps: 14325.0, logId: '26-01-28--19-39--Absorbs--Icecrown' },
    { player: 'Extetdruid', dps: 14279.7, logId: '26-01-28--19-39--Absorbs--Icecrown' },
    { player: 'Straxedix', dps: 13019.8, logId: '26-01-28--19-39--Absorbs--Icecrown' },
    { player: 'Fedeksinjo', dps: 12660.2, logId: '26-01-28--20-15--Senrysuta--Icecrown' }
];

// Load existing data
const dataPath = path.join(__dirname, '..', 'data', 'top-parsers.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Helper to create boss entry
function createBossEntry(dpsArray, defaultLogId) {
    const topPerformances = dpsArray.map(({ player, dps, logId }) => ({
        player,
        class: playerClasses[player] || 'Unknown',
        dps: Math.round(dps * 10) / 10,
        date: HALION_DATE,
        logId: logId || defaultLogId
    }));

    const bestOverall = { ...topPerformances[0] };

    const bestByClass = {};
    for (const perf of topPerformances) {
        if (!bestByClass[perf.class] || perf.dps > bestByClass[perf.class].dps) {
            bestByClass[perf.class] = { ...perf };
        }
    }

    return {
        bestOverall,
        bestByClass,
        topPerformances
    };
}

// Remove old incorrect Halion entries if they exist
delete data.dps['Halion (Outside)'];
delete data.dps['Halion (Inside)'];

// Add correct Halion entries
data.dps['Halion (Outside)'] = createBossEntry(halionOutside, '26-01-28--19-08--Felesminor--Icecrown');
data.dps['Halion (Inside)'] = createBossEntry(halionInside);

// Update metadata
data.totalLogs = 41; // 38 ICC + 3 Halion
data.logBreakdown = {
    icc: 38,
    halion: 3
};
data.generated = new Date().toISOString();

// Save
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log('=== HALION CORRECTED ===');
console.log('\nHalion (Outside) - Top 5:');
halionOutside.forEach((p, i) => console.log(`  ${i+1}. ${p.player} - ${p.dps} DPS`));
console.log('\nHalion (Inside) - Top 5:');
halionInside.forEach((p, i) => console.log(`  ${i+1}. ${p.player} - ${p.dps} DPS`));
console.log('\nTotal logs:', data.totalLogs);
