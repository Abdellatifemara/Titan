const fs = require('fs');
const path = require('path');

// All logs being processed
const LOGS = [
    { id: '26-01-28--22-47--Yeamag--Icecrown', date: '2026-01-28' },
    { id: '26-01-29--21-03--Yeadudutwo--Icecrown', date: '2026-01-29' },
    { id: '26-01-30--17-34--Yeapalathree--Icecrown', date: '2026-01-30' },
    { id: '26-01-30--20-46--Absorbs--Icecrown', date: '2026-01-30' },
    { id: '26-01-30--23-16--Unholyleap--Icecrown', date: '2026-01-30' },
    { id: '26-01-30--20-58--Waawaadko--Icecrown', date: '2026-01-30' },
    { id: '26-01-31--17-32--Catalyzer--Icecrown', date: '2026-01-31' },
    { id: '26-01-31--20-49--Yeapalatwo--Icecrown', date: '2026-01-31' },
    { id: '26-02-01--17-39--Yeapriesttwo--Icecrown', date: '2026-02-01' },
    { id: '26-02-01--20-56--Yeapriest--Icecrown', date: '2026-02-01' },
    { id: '26-02-01--23-05--Yeapriest--Icecrown', date: '2026-02-01' }
];

// Player class mapping (best guess from names/specs)
const playerClasses = {
    // Mages
    'Itsmage': 'Mage', 'Waawaafire': 'Mage', 'Jebenimage': 'Mage', 'Mageforte': 'Mage',
    'Cromaniac': 'Mage', 'Croman': 'Mage', 'Mecymage': 'Mage', 'Extetmag': 'Mage',
    'Yeamag': 'Mage', 'Smolextet': 'Mage',
    // Warriors
    'Carnaged': 'Warrior', 'Penatrated': 'Warrior', 'Mekambe': 'Warrior', 'Oldmb': 'Warrior',
    'Mecywarr': 'Warrior', 'Trollfury': 'Warrior', 'Lmfury': 'Warrior', 'Duleewarr': 'Warrior',
    'Stanijaa': 'Warrior',
    // Rogues
    'Kaczorro': 'Rogue', 'Poisonrage': 'Rogue', 'Ninepieces': 'Rogue', 'Yearog': 'Rogue',
    'Lilythiev': 'Rogue', 'Jebeniirogue': 'Rogue',
    // Druids
    'Duleferal': 'Druid', 'Feralforte': 'Druid', 'Kaczorro': 'Druid', 'Extetdudu': 'Druid',
    'Panetone': 'Druid', 'Djubretarka': 'Druid', 'Compadree': 'Druid', 'Taurenshape': 'Druid',
    'Dudurasta': 'Druid', 'Mecydudu': 'Druid', 'Radirondud': 'Druid', 'Beastrasta': 'Druid',
    'Rastatotal': 'Druid', 'Sstealrasta': 'Druid', 'Rastachepsi': 'Druid',
    // Death Knights
    'Strangedude': 'Death Knight', 'Ritamnereda': 'Death Knight', 'Snipdk': 'Death Knight',
    'Halodeath': 'Death Knight', 'Waawaadko': 'Death Knight', 'Extetdk': 'Death Knight',
    'Shhadowko': 'Death Knight', 'Selkoo': 'Death Knight', 'Selkodk': 'Death Knight',
    'Unholyleap': 'Death Knight',
    // Hunters
    'Shatzie': 'Hunter', 'Mecyhunt': 'Hunter', 'Ndmiibogaine': 'Hunter', 'Ndmiiqt': 'Hunter',
    'Ndmiibex': 'Hunter', 'Cylaxh': 'Hunter', 'Cylaxm': 'Hunter',
    // Priests
    'Waawaapriest': 'Priest', 'Snippala': 'Priest', 'Devilheal': 'Priest', 'Yeapriest': 'Priest',
    'Yeapriesttwo': 'Priest', 'Shadowhymn': 'Priest', 'Jebenipriest': 'Priest', 'Extetdisco': 'Priest',
    // Paladins
    'Hawe': 'Paladin', 'Schweps': 'Paladin', 'Schweeps': 'Paladin', 'Taurenirl': 'Paladin',
    'Peacheas': 'Paladin', 'Waawaa': 'Paladin', 'Waawwa': 'Paladin', 'Yeapalathree': 'Paladin',
    'Yeapalatwo': 'Paladin', 'Palanator': 'Paladin', 'Halopaladin': 'Paladin', 'Halorakija': 'Paladin',
    // Warlocks
    'Kidcovid': 'Warlock', 'Extetlock': 'Warlock', 'Xerxsei': 'Warlock', 'Xerxlock': 'Warlock',
    // Shamans
    'Extetshamy': 'Shaman', 'Atreff': 'Shaman', 'Shadowatreff': 'Shaman',
    // Mixed/Unknown - need to assign based on name patterns
    'Rekless': 'Warrior', 'Reckles': 'Warrior',
    'Gangreene': 'Death Knight',
    'Sossyete': 'Mage',
    'Halocognac': 'Mage',
    'Paintrainn': 'Warrior',
    'Tucaa': 'Rogue',
    'Famalee': 'Warrior',
    'Sakeza': 'Rogue', 'Sakezer': 'Rogue',
    'Brule': 'Warrior',
    'Jvt': 'Rogue',
    'Kelzhar': 'Mage',
    'Hsalic': 'Paladin',
    'Rayleigh': 'Mage',
    'Kushobie': 'Rogue',
    'Zoyela': 'Mage',
    'Pljugetina': 'Warrior',
    'Mecyrog': 'Rogue',
    'Lazypants': 'Rogue',
    'Dyvanth': 'Warrior',
    'Halogin': 'Mage',
    'Telonja': 'Warrior',
    'Zazbaz': 'Warrior',
    'Dsalic': 'Paladin',
    'Extetwarko': 'Warlock',
    'Ariushp': 'Death Knight',
    'Marchamedia': 'Warrior',
    'Catalyzer': 'Mage',
    'Parhasard': 'Mage',
    'Frolie': 'Rogue',
    'Tiadre': 'Warlock',
    'Jowanka': 'Mage',
    'Sapbringer': 'Rogue',
    'Balenciagodx': 'Warrior',
    'Varosan': 'Warrior',
    'Sikezhina': 'Rogue',
    'Pernat': 'Warrior',
    'Luffythegoat': 'Warrior',
    'Otherii': 'Warrior',
    'Dafuan': 'Warrior',
    'Krealis': 'Mage',
    'Headstriker': 'Warrior',
    'Keksakoks': 'Rogue',
    'Challenged': 'Warrior',
    'Dentedeleite': 'Warrior',
    'Pandalada': 'Druid',
    'Dejacigantri': 'Warrior',
    'Qracpalac': 'Paladin',
    'Todoresko': 'Warrior',
    'Rokanica': 'Rogue',
    'Eemperor': 'Mage',
    'Heartripper': 'Rogue',
    'Mancek': 'Warrior',
    'Deroice': 'Mage',
    'Torkosan': 'Warrior',
    'Tetejacc': 'Rogue',
    'Agachew': 'Warrior',
    'Sxvxge': 'Rogue',
    'Lookaatme': 'Mage',
    'Straxedix': 'Rogue',
    'Moryena': 'Mage',
    'Fryzzt': 'Warrior',
    'Cviske': 'Warrior',
    'Neegher': 'Warrior',
    'Adrooluc': 'Warlock',
    'Didizito': 'Warrior',
};

// All boss data collected from the logs
const bossData = {
    'Lord Marrowgar': [
        // Log: 26-02-01--17-39--Yeapriesttwo
        { player: 'Itsmage', dps: 23778.8, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
        { player: 'Waawaafire', dps: 23715.5, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
        { player: 'Kaczorro', dps: 22587.3, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
        { player: 'Carnaged', dps: 22063.4, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
        // Log: 26-01-31--17-32--Catalyzer
        { player: 'Sstealrasta', dps: 23844.6, date: '2026-01-31', logId: '26-01-31--17-32--Catalyzer--Icecrown' },
        { player: 'Xerxsei', dps: 23194.4, date: '2026-01-31', logId: '26-01-31--17-32--Catalyzer--Icecrown' },
        { player: 'Schweeps', dps: 21624.5, date: '2026-01-31', logId: '26-01-31--17-32--Catalyzer--Icecrown' },
        // Log: 26-01-31--20-49--Yeapalatwo
        { player: 'Smolextet', dps: 22228.3, date: '2026-01-31', logId: '26-01-31--20-49--Yeapalatwo--Icecrown' },
        // Log: 26-01-28--22-47--Yeamag
        { player: 'Yeamag', dps: 22050.2, date: '2026-01-28', logId: '26-01-28--22-47--Yeamag--Icecrown' },
        // Log: 26-02-01--20-56--Yeapriest
        { player: 'Rekless', dps: 21849.1, date: '2026-02-01', logId: '26-02-01--20-56--Yeapriest--Icecrown' },
    ],
    'Festergut': [
        // Log: 26-02-01--17-39--Yeapriesttwo
        { player: 'Waawaafire', dps: 23017.8, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
        { player: 'Carnaged', dps: 21271.7, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
        { player: 'Poisonrage', dps: 21161.8, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
        { player: 'Itsmage', dps: 21052.0, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
        // Log: 26-01-31--17-32--Catalyzer
        { player: 'Xerxsei', dps: 22000.2, date: '2026-01-31', logId: '26-01-31--17-32--Catalyzer--Icecrown' },
        { player: 'Lmfury', dps: 21511.2, date: '2026-01-31', logId: '26-01-31--17-32--Catalyzer--Icecrown' },
        // Log: 26-01-31--20-49--Yeapalatwo
        { player: 'Stanijaa', dps: 21941.6, date: '2026-01-31', logId: '26-01-31--20-49--Yeapalatwo--Icecrown' },
        { player: 'Waawwa', dps: 21581.3, date: '2026-01-31', logId: '26-01-31--20-49--Yeapalatwo--Icecrown' },
        { player: 'Smolextet', dps: 21313.6, date: '2026-01-31', logId: '26-01-31--20-49--Yeapalatwo--Icecrown' },
        // Log: 26-01-30--17-34--Yeapalathree
        { player: 'Mekambe', dps: 21164.9, date: '2026-01-30', logId: '26-01-30--17-34--Yeapalathree--Icecrown' },
        { player: 'Extetmag', dps: 21152.3, date: '2026-01-30', logId: '26-01-30--17-34--Yeapalathree--Icecrown' },
        { player: 'Keksakoks', dps: 20756.6, date: '2026-01-30', logId: '26-01-30--17-34--Yeapalathree--Icecrown' },
        // Log: 26-01-30--20-46--Absorbs
        { player: 'Oldmb', dps: 21605.3, date: '2026-01-30', logId: '26-01-30--20-46--Absorbs--Icecrown' },
    ],
    'Rotface': [
        { player: 'Itsmage', dps: 22250.3, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
        { player: 'Carnaged', dps: 21993.6, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
        { player: 'Waawaafire', dps: 21061.1, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
        { player: 'Shatzie', dps: 20711.9, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
        { player: 'Duleferal', dps: 20552.2, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
    ],
    'Deathbringer Saurfang': [
        { player: 'Itsmage', dps: 24303.3, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
        { player: 'Carnaged', dps: 22709.6, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
        { player: 'Kaczorro', dps: 22579.2, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
        { player: 'Shatzie', dps: 21756.5, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
        { player: 'Poisonrage', dps: 21567.7, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
    ],
    'Professor Putricide': [
        { player: 'Waawaafire', dps: 18748.5, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
        { player: 'Carnaged', dps: 18634.4, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
    ],
    'Blood Prince Council': [
        { player: 'Itsmage', dps: 20159.4, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
        { player: 'Waawaafire', dps: 18296.6, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
        { player: 'Mageforte', dps: 17030.6, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
    ],
    "Blood-Queen Lana'thel": [
        // Top parses across all logs
        { player: 'Itsmage', dps: 41836.2, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
        { player: 'Yeamag', dps: 40194.1, date: '2026-01-28', logId: '26-01-28--22-47--Yeamag--Icecrown' },
        { player: 'Mekambe', dps: 39511.0, date: '2026-01-30', logId: '26-01-30--17-34--Yeapalathree--Icecrown' },
        { player: 'Xerxsei', dps: 39291.5, date: '2026-01-31', logId: '26-01-31--17-32--Catalyzer--Icecrown' },
        { player: 'Reckles', dps: 37700.1, date: '2026-01-31', logId: '26-01-31--20-49--Yeapalatwo--Icecrown' },
        { player: 'Oldmb', dps: 33962.3, date: '2026-01-30', logId: '26-01-30--20-46--Absorbs--Icecrown' },
        { player: 'Gangreene', dps: 32890.3, date: '2026-02-01', logId: '26-02-01--20-56--Yeapriest--Icecrown' },
        { player: 'Yeadudutwo', dps: 29700.2, date: '2026-01-29', logId: '26-01-29--21-03--Yeadudutwo--Icecrown' },
        { player: 'Waawaafire', dps: 28411.8, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
        { player: 'Sstealrasta', dps: 28515.2, date: '2026-01-31', logId: '26-01-31--17-32--Catalyzer--Icecrown' },
    ],
    'Sindragosa': [
        { player: 'Carnaged', dps: 16887.3, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
        { player: 'Ariushp', dps: 15763.7, date: '2026-01-31', logId: '26-01-31--17-32--Catalyzer--Icecrown' },
        { player: 'Waawaadko', dps: 15783.0, date: '2026-01-30', logId: '26-01-30--20-46--Absorbs--Icecrown' },
        { player: 'Halodeath', dps: 15154.0, date: '2026-01-29', logId: '26-01-29--21-03--Yeadudutwo--Icecrown' },
        { player: 'Rekless', dps: 14627.3, date: '2026-02-01', logId: '26-02-01--20-56--Yeapriest--Icecrown' },
    ],
    'The Lich King': [
        { player: 'Carnaged', dps: 17120.4, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
        { player: 'Lmfury', dps: 16499.3, date: '2026-01-31', logId: '26-01-31--17-32--Catalyzer--Icecrown' },
        { player: 'Dafuan', dps: 16154.5, date: '2026-01-29', logId: '26-01-29--21-03--Yeadudutwo--Icecrown' },
        { player: 'Waawwa', dps: 15956.5, date: '2026-01-31', logId: '26-01-31--20-49--Yeapalatwo--Icecrown' },
        { player: 'Penatrated', dps: 15609.4, date: '2026-01-30', logId: '26-01-30--17-34--Yeapalathree--Icecrown' },
        { player: 'Mekambe', dps: 15535.7, date: '2026-01-30', logId: '26-01-30--17-34--Yeapalathree--Icecrown' },
        { player: 'Shatzie', dps: 15176.8, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
    ],
    'Lady Deathwhisper': [
        { player: 'Carnaged', dps: 19584.4, date: '2026-02-01', logId: '26-02-01--17-39--Yeapriesttwo--Icecrown' },
    ],
};

// Load existing data
const dataPath = path.join(__dirname, '..', 'data', 'top-parsers.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

let updatesCount = 0;
const newRecords = [];

// Process each boss
for (const [bossName, players] of Object.entries(bossData)) {
    if (!data.dps[bossName]) {
        console.log(`Boss "${bossName}" not found in data, skipping...`);
        continue;
    }

    const bossEntry = data.dps[bossName];

    for (const entry of players) {
        const playerClass = playerClasses[entry.player];
        if (!playerClass) {
            console.log(`Unknown class for player ${entry.player}, skipping...`);
            continue;
        }

        const record = {
            player: entry.player,
            class: playerClass,
            dps: Math.round(entry.dps * 10) / 10,
            date: entry.date,
            logId: entry.logId
        };

        // Check if beats best overall
        if (entry.dps > bossEntry.bestOverall.dps) {
            console.log(`NEW BEST OVERALL: ${bossName} - ${entry.player} (${playerClass}) ${entry.dps.toFixed(1)} DPS (was ${bossEntry.bestOverall.dps} by ${bossEntry.bestOverall.player})`);
            bossEntry.bestOverall = record;
            updatesCount++;
            newRecords.push({ type: 'bestOverall', boss: bossName, ...record });
        }

        // Check if beats best for class
        if (!bossEntry.bestByClass[playerClass] || entry.dps > bossEntry.bestByClass[playerClass].dps) {
            const old = bossEntry.bestByClass[playerClass];
            if (old) {
                console.log(`NEW BEST ${playerClass}: ${bossName} - ${entry.player} ${entry.dps.toFixed(1)} DPS (was ${old.dps} by ${old.player})`);
            } else {
                console.log(`FIRST ${playerClass}: ${bossName} - ${entry.player} ${entry.dps.toFixed(1)} DPS`);
            }
            bossEntry.bestByClass[playerClass] = record;
            updatesCount++;
        }

        // Update top performances
        const existingIdx = bossEntry.topPerformances.findIndex(p => p.player === entry.player);
        if (existingIdx !== -1) {
            if (entry.dps > bossEntry.topPerformances[existingIdx].dps) {
                bossEntry.topPerformances[existingIdx] = record;
            }
        } else {
            if (bossEntry.topPerformances.length < 10 || entry.dps > bossEntry.topPerformances[bossEntry.topPerformances.length - 1].dps) {
                bossEntry.topPerformances.push(record);
                bossEntry.topPerformances.sort((a, b) => b.dps - a.dps);
                bossEntry.topPerformances = bossEntry.topPerformances.slice(0, 10);
            }
        }
    }
}

// Update metadata
data.totalLogs = (data.totalLogs || 27) + LOGS.length;
data.dateRange.to = '2026-02-01';
data.generated = new Date().toISOString();

// Save updated data
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log(`\n=== SUMMARY ===`);
console.log(`Logs processed: ${LOGS.length}`);
console.log(`Total updates: ${updatesCount}`);
console.log(`Total logs now: ${data.totalLogs}`);
console.log(`Date range: ${data.dateRange.from} to ${data.dateRange.to}`);

if (newRecords.length > 0) {
    console.log(`\n=== NEW RECORDS ===`);
    newRecords.forEach(r => {
        console.log(`${r.boss}: ${r.player} (${r.class}) - ${r.dps} DPS`);
    });
}
