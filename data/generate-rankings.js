/**
 * TITAN Guild - Top Parsers Data Generator
 *
 * This script processes all raid log JSONs and generates aggregated rankings.
 * Run this after adding new uwu-logs to update the leaderboards.
 *
 * Usage: node generate-rankings.js
 */

const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, 'logs');
const OUTPUT_FILE = path.join(__dirname, 'top-parsers.json');

// ICC boss order
const BOSS_ORDER = [
    'Lord Marrowgar',
    'Lady Deathwhisper',
    'Deathbringer Saurfang',
    'Rotface',
    'Festergut',
    'Professor Putricide',
    'Blood Prince Council',
    'Blood-Queen Lana\'thel',
    'Sindragosa',
    'The Lich King'
];

// All WoW classes
const CLASSES = [
    'Death Knight', 'Druid', 'Hunter', 'Mage', 'Paladin',
    'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior'
];

function loadAllLogs() {
    const logs = [];
    const files = fs.readdirSync(LOGS_DIR).filter(f => f.endsWith('.json'));

    for (const file of files) {
        try {
            const content = fs.readFileSync(path.join(LOGS_DIR, file), 'utf8');
            const data = JSON.parse(content);
            logs.push({ file, ...data });
        } catch (err) {
            console.warn(`Warning: Could not parse ${file}:`, err.message);
        }
    }

    return logs.sort((a, b) => a.date.localeCompare(b.date));
}

function processLogs(logs) {
    const result = {
        generated: new Date().toISOString(),
        totalLogs: logs.length,
        dateRange: {
            from: logs[0]?.date || null,
            to: logs[logs.length - 1]?.date || null
        },
        dps: {},
        healing: {}
    };

    // Initialize boss structures
    for (const boss of BOSS_ORDER) {
        result.dps[boss] = {
            bestOverall: null,
            bestByClass: {},
            topPerformances: []
        };
        result.healing[boss] = {
            bestOverall: null,
            bestByClass: {},
            topPerformances: []
        };
    }

    // Process each log
    for (const log of logs) {
        if (!log.bosses) continue;

        const healersInLog = new Set();
        for (const bossData of Object.values(log.bosses)) {
            if (bossData.healing && Array.isArray(bossData.healing)) {
                for (const entry of bossData.healing) {
                    healersInLog.add(entry.player);
                }
            }
        }

        for (const [bossName, bossData] of Object.entries(log.bosses)) {
            if (!BOSS_ORDER.includes(bossName)) continue;

            // Process DPS
            if (bossData.dps && Array.isArray(bossData.dps)) {
                for (const entry of bossData.dps) {
                    if (!entry.player || !entry.class || !entry.dps || healersInLog.has(entry.player)) {
                        continue;
                    }

                    const perf = {
                        player: entry.player,
                        class: entry.class,
                        dps: entry.dps,
                        date: log.date,
                        logId: log.logId || log.file
                    };

                    // Add to all performances for this boss
                    result.dps[bossName].topPerformances.push(perf);

                    // Check if best overall
                    if (!result.dps[bossName].bestOverall ||
                        entry.dps > result.dps[bossName].bestOverall.dps) {
                        result.dps[bossName].bestOverall = perf;
                    }

                    // Check if best for class
                    if (!result.dps[bossName].bestByClass[entry.class] ||
                        entry.dps > result.dps[bossName].bestByClass[entry.class].dps) {
                        result.dps[bossName].bestByClass[entry.class] = perf;
                    }
                }
            }

            // Process Healing
            if (bossData.healing && Array.isArray(bossData.healing)) {
                for (const entry of bossData.healing) {
                    if (!entry.player || !entry.class || !entry.hps) continue;

                    const perf = {
                        player: entry.player,
                        class: entry.class,
                        hps: entry.hps,
                        date: log.date,
                        logId: log.logId || log.file
                    };

                    // Add to all performances for this boss
                    result.healing[bossName].topPerformances.push(perf);

                    // Check if best overall
                    if (!result.healing[bossName].bestOverall ||
                        entry.hps > result.healing[bossName].bestOverall.hps) {
                        result.healing[bossName].bestOverall = perf;
                    }

                    // Check if best for class
                    if (!result.healing[bossName].bestByClass[entry.class] ||
                        entry.hps > result.healing[bossName].bestByClass[entry.class].hps) {
                        result.healing[bossName].bestByClass[entry.class] = perf;
                    }
                }
            }
        }
    }

    // Sort and limit top performances
    for (const boss of BOSS_ORDER) {
        // Sort DPS top performances by DPS descending, keep top 20
        result.dps[boss].topPerformances.sort((a, b) => b.dps - a.dps);
        result.dps[boss].topPerformances = result.dps[boss].topPerformances.slice(0, 20);

        // Sort healing top performances by HPS descending, keep top 20
        result.healing[boss].topPerformances.sort((a, b) => b.hps - a.hps);
        result.healing[boss].topPerformances = result.healing[boss].topPerformances.slice(0, 20);
    }

    // Create Deathbringer lookup for guild page (all unique players with their best)
    const deathbringerLookup = {};
    const dbPerfs = result.dps['Deathbringer Saurfang']?.topPerformances || [];

    // Get all Deathbringer performances from all logs (not just top 20)
    for (const log of logs) {
        if (!log.bosses || !log.bosses['Deathbringer Saurfang']) continue;
        const dbData = log.bosses['Deathbringer Saurfang'];
        if (!dbData.dps) continue;

        for (const entry of dbData.dps) {
            const playerLower = entry.player.toLowerCase();
            if (!deathbringerLookup[playerLower] || entry.dps > deathbringerLookup[playerLower].dps) {
                deathbringerLookup[playerLower] = {
                    player: entry.player,
                    class: entry.class,
                    dps: entry.dps,
                    date: log.date
                };
            }
        }
    }
    result.deathbringerLookup = deathbringerLookup;

    return result;
}

function main() {
    console.log('Loading logs from:', LOGS_DIR);
    const logs = loadAllLogs();
    console.log(`Found ${logs.length} log files`);

    if (logs.length === 0) {
        console.error('No logs found!');
        process.exit(1);
    }

    console.log('Processing logs...');
    const rankings = processLogs(logs);

    console.log('Writing output to:', OUTPUT_FILE);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(rankings, null, 2));

    console.log('\nSummary:');
    console.log(`- Total logs: ${rankings.totalLogs}`);
    console.log(`- Date range: ${rankings.dateRange.from} to ${rankings.dateRange.to}`);
    console.log(`- Deathbringer players tracked: ${Object.keys(rankings.deathbringerLookup).length}`);
    console.log('\nDone!');
}

main();
