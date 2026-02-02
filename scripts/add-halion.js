const fs = require('fs');
const path = require('path');

// Halion RS data from logs
const HALION_DATE = '2026-01-28';

// Player class mapping for Halion participants
const playerClasses = {
    // From existing data
    'Ninellisfake': 'Warrior',
    'Oldmb': 'Warrior',
    'Extetdudu': 'Druid',
    'Ymortus': 'Warrior',  // fury warrior based on context
    'Avaya': 'Paladin',
    'Penetratorcr': 'Rogue',
    'Lalakers': 'Paladin',
    'Reckles': 'Mage',
    'Waawaarogue': 'Rogue',
    'Gefjon': 'Warrior',
    'Mecyhunt': 'Hunter',
    'Manbearcatz': 'Druid',
    'Chrissy': 'Paladin',
    'Lookatmeetwo': 'Priest',
    'Malleena': 'Priest',
    'Cviske': 'Warlock',
    'Keyadk': 'Death Knight',
    // Halion Inside players
    'Recklesmage': 'Mage',
    'Kissme': 'Warlock',
    'Gnomieta': 'Mage',
    'Extetdruid': 'Druid',
    'Chemtrailsky': 'Warlock',
    'Waawaapriest': 'Priest',
    'Straxedix': 'Rogue',
    'Panetone': 'Druid',
    'Woogie': 'Warrior',
    'Zazbaz': 'Warlock',
    'Alkaizer': 'Warlock',
    'Yeapaladin': 'Paladin',
    'Crombat': 'Rogue',
    'Mecydudu': 'Druid',
    'Trollfury': 'Warrior',
    // Third Halion log players
    'Fedeksinjo': 'Warrior',
    'Pljugetina': 'Warrior',
    'Senrysuta': 'Druid',
    'Rayleigh': 'Mage',
    'Chibzfury': 'Warrior',
    'Dontgowwlil': 'Death Knight',
    'Yeapriest': 'Priest',
    'Jaddonlok': 'Warlock',
    'Icyfck': 'Mage',
    'Penetrattoor': 'Rogue',
    'Dotrundot': 'Warlock',
    'Atreff': 'Shaman',
    'Hahlocaust': 'Death Knight',
    'Torkosan': 'Hunter',
    'Waawaalockie': 'Warlock',
    'Grompita': 'Warrior',
    'Cylaxs': 'Hunter'
};

// Halion (Outside) - 32nd RSHC - Log: 26-01-28--19-08--Felesminor--Icecrown
const halionOutsideDps = [
    { player: 'Ninellisfake', dps: 13857.2 },
    { player: 'Oldmb', dps: 12628.1 },
    { player: 'Extetdudu', dps: 12620.2 },
    { player: 'Ymortus', dps: 10415.8 },
    { player: 'Avaya', dps: 8813.3 },
    { player: 'Penetratorcr', dps: 5531.6 },
    { player: 'Lalakers', dps: 5442.9 },
    { player: 'Reckles', dps: 5168.1 },
    { player: 'Waawaarogue', dps: 5044.7 },
    { player: 'Gefjon', dps: 4973.9 }
];

// Halion (Inside) - Combined best from both inside logs
// Log 1: 26-01-28--19-39--Absorbs--Icecrown (33rd RSHC)
// Log 2: 26-01-28--20-15--Senrysuta--Icecrown
const halionInsideDps = [
    { player: 'Fedeksinjo', dps: 12660.2, logId: '26-01-28--20-15--Senrysuta--Icecrown' },
    { player: 'Pljugetina', dps: 12377.0, logId: '26-01-28--20-15--Senrysuta--Icecrown' },
    { player: 'Senrysuta', dps: 12352.3, logId: '26-01-28--20-15--Senrysuta--Icecrown' },
    { player: 'Recklesmage', dps: 11661.9, logId: '26-01-28--19-39--Absorbs--Icecrown' },
    { player: 'Rayleigh', dps: 11560.3, logId: '26-01-28--20-15--Senrysuta--Icecrown' },
    { player: 'Kissme', dps: 11340.8, logId: '26-01-28--19-39--Absorbs--Icecrown' },
    { player: 'Chibzfury', dps: 9954.3, logId: '26-01-28--20-15--Senrysuta--Icecrown' },
    { player: 'Gnomieta', dps: 9752.1, logId: '26-01-28--19-39--Absorbs--Icecrown' },
    { player: 'Extetdruid', dps: 9183.3, logId: '26-01-28--19-39--Absorbs--Icecrown' },
    { player: 'Chemtrailsky', dps: 9111.9, logId: '26-01-28--19-39--Absorbs--Icecrown' }
];

// Load existing data
const dataPath = path.join(__dirname, '..', 'data', 'top-parsers.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Helper to create boss entry
function createBossEntry(dpsArray, logIdOverride) {
    const topPerformances = dpsArray.map(({ player, dps, logId }) => ({
        player,
        class: playerClasses[player] || 'Unknown',
        dps: Math.round(dps * 10) / 10,
        date: HALION_DATE,
        logId: logId || logIdOverride
    }));

    // Best overall
    const bestOverall = { ...topPerformances[0] };

    // Best by class
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

// Add Halion bosses to DPS section
data.dps['Halion (Outside)'] = createBossEntry(halionOutsideDps, '26-01-28--19-08--Felesminor--Icecrown');
data.dps['Halion (Inside)'] = createBossEntry(halionInsideDps);

// Update metadata - add 3 RS logs
data.totalLogs = (data.totalLogs || 38) + 3;
data.generated = new Date().toISOString();

// Save updated data
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log('=== HALION ADDED ===');
console.log('\nHalion (Outside) - Best Overall:', data.dps['Halion (Outside)'].bestOverall.player,
    data.dps['Halion (Outside)'].bestOverall.dps, 'DPS');
console.log('Halion (Inside) - Best Overall:', data.dps['Halion (Inside)'].bestOverall.player,
    data.dps['Halion (Inside)'].bestOverall.dps, 'DPS');
console.log('\nTotal logs:', data.totalLogs);
