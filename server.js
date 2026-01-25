const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('.'));

const ADMIN_PASSWORD = 'titan2026'; // Change this!

// Middleware to check admin password
function checkAuth(req, res, next) {
    const password = req.headers['x-admin-password'];
    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

// Parse Discord composition format
function parseComposition(text) {
    const composition = {
        tanks: [],
        melee: [],
        ranged: [],
        healers: []
    };

    const classMap = {
        'dk': 'Death Knight',
        'death knight': 'Death Knight',
        'protection': 'Paladin',
        'unholy': 'Death Knight',
        'fury': 'Warrior',
        'ret': 'Paladin',
        'combat': 'Rogue',
        'feral': 'Druid',
        'boomie': 'Druid',
        'boomy': 'Druid',
        'mm': 'Hunter',
        'fire': 'Mage',
        'arcane': 'Mage',
        'demo': 'Warlock',
        'demonology': 'Warlock',
        'affliction': 'Warlock',
        'destro': 'Warlock',
        'shadow': 'Priest',
        'holy': 'Paladin',
        'disco': 'Priest',
        'discipline': 'Priest',
        'shamanresto': 'Shaman',
        'restoration': 'Shaman',
        'resto': 'Shaman',
        'elemental': 'Shaman',
        'enhancement': 'Shaman'
    };

    const specMap = {
        'dk': 'Blood',
        'death knight tank': 'Blood',
        'protection': 'Protection',
        'unholy': 'Unholy',
        'fury': 'Fury',
        'ret': 'Retribution',
        'combat': 'Combat',
        'feral': 'Feral',
        'boomie': 'Balance',
        'boomy': 'Balance',
        'mm': 'Marksmanship',
        'fire': 'Fire',
        'arcane': 'Arcane',
        'demo': 'Demonology',
        'demonology': 'Demonology',
        'affliction': 'Affliction',
        'destro': 'Destruction',
        'shadow': 'Shadow',
        'holy': 'Holy',
        'disco': 'Discipline',
        'discipline': 'Discipline',
        'shamanresto': 'Restoration',
        'restoration': 'Restoration',
        'resto': 'Restoration'
    };

    let currentSection = null;
    const lines = text.split('\n');

    for (const line of lines) {
        const lower = line.toLowerCase();

        if (lower.includes('-tanks-') || lower.includes('tanks')) {
            currentSection = 'tanks';
            continue;
        } else if (lower.includes('-meele') || lower.includes('-melee') || lower.includes('melee dps')) {
            currentSection = 'melee';
            continue;
        } else if (lower.includes('-range') || lower.includes('range dps')) {
            currentSection = 'ranged';
            continue;
        } else if (lower.includes('-healer') || lower.includes('healers')) {
            currentSection = 'healers';
            continue;
        }

        // Parse player line - look for @PlayerName pattern
        const playerMatch = line.match(/@([^\s]+)/);
        if (playerMatch && currentSection) {
            let playerName = playerMatch[1].replace(/[^\w]/g, '');

            // Find class/spec from the line
            let playerClass = 'Unknown';
            let playerSpec = 'Unknown';

            for (const [key, value] of Object.entries(classMap)) {
                if (lower.includes(key)) {
                    playerClass = value;
                    playerSpec = specMap[key] || 'Unknown';
                    break;
                }
            }

            if (currentSection && playerName) {
                composition[currentSection].push({
                    name: playerName,
                    class: playerClass,
                    spec: playerSpec
                });
            }
        }
    }

    return composition;
}

// API: Get raids
app.get('/api/raids', (req, res) => {
    try {
        const data = fs.readFileSync('./data/raid-logs.json', 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.json({ raids: [] });
    }
});

// API: Add raid
app.post('/api/raids', checkAuth, (req, res) => {
    try {
        const { date, raidName, bossKills, logUrl, compositionText, notes } = req.body;

        let raids = { raids: [] };
        try {
            raids = JSON.parse(fs.readFileSync('./data/raid-logs.json', 'utf8'));
        } catch (e) {}

        const composition = compositionText ? parseComposition(compositionText) : null;

        const newRaid = {
            id: Date.now().toString(),
            date,
            raidName: raidName || 'ICC 25 HC',
            bossKills: bossKills || 12,
            logUrl,
            composition,
            notes,
            createdAt: new Date().toISOString()
        };

        raids.raids.unshift(newRaid);
        fs.writeFileSync('./data/raid-logs.json', JSON.stringify(raids, null, 2));

        res.json({ success: true, raid: newRaid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Parse UwU logs link
app.post('/api/parse-uwu', checkAuth, async (req, res) => {
    try {
        const { logUrl } = req.body;

        // Extract log ID from URL
        // Format: https://uwu-logs.xyz/reports/YY-MM-DD--HH-MM--CharName--Server/
        // or: https://uwu-logs.xyz/log/abc123
        let logId;
        let apiUrl;

        const reportsMatch = logUrl.match(/\/reports\/([^\/]+)/);
        const logMatch = logUrl.match(/\/log\/([a-zA-Z0-9]+)/);

        if (reportsMatch) {
            logId = reportsMatch[1];
            apiUrl = `https://uwu-logs.xyz/api/reports/${logId}`;
        } else if (logMatch) {
            logId = logMatch[1];
            apiUrl = `https://uwu-logs.xyz/api/log/${logId}`;
        } else {
            return res.status(400).json({ error: 'Invalid UwU logs URL format' });
        }

        // Fetch log data
        const response = await fetch(apiUrl);
        if (!response.ok) {
            return res.status(400).json({ error: 'Failed to fetch log data' });
        }

        const logData = await response.json();

        // Load current top parsers
        let topParsers = {};
        try {
            topParsers = JSON.parse(fs.readFileSync('./data/top-parsers.json', 'utf8'));
        } catch (e) {
            topParsers = {
                dps: {},
                totalLogs: 0,
                dateRange: { from: '', to: '' },
                generated: new Date().toISOString()
            };
        }

        const updates = [];
        const logDate = logData.date || new Date().toISOString().split('T')[0];

        // Process each boss encounter
        if (logData.encounters) {
            for (const encounter of logData.encounters) {
                const bossName = encounter.boss;
                if (!topParsers.dps[bossName]) {
                    topParsers.dps[bossName] = {
                        bestOverall: null,
                        bestByClass: {},
                        topPerformances: []
                    };
                }

                const boss = topParsers.dps[bossName];

                // Process each player's DPS
                if (encounter.players) {
                    for (const player of encounter.players) {
                        const playerData = {
                            player: player.name,
                            class: player.class,
                            dps: player.dps,
                            date: logDate,
                            logId: logId
                        };

                        // Check if this beats the overall best
                        if (!boss.bestOverall || player.dps > boss.bestOverall.dps) {
                            updates.push({
                                boss: bossName,
                                type: 'bestOverall',
                                old: boss.bestOverall,
                                new: playerData
                            });
                            boss.bestOverall = playerData;
                        }

                        // Check if this beats the class best
                        if (!boss.bestByClass[player.class] || player.dps > boss.bestByClass[player.class].dps) {
                            updates.push({
                                boss: bossName,
                                type: 'bestByClass',
                                class: player.class,
                                old: boss.bestByClass[player.class],
                                new: playerData
                            });
                            boss.bestByClass[player.class] = playerData;
                        }

                        // Add to top performances and sort
                        boss.topPerformances.push(playerData);
                        boss.topPerformances.sort((a, b) => b.dps - a.dps);
                        boss.topPerformances = boss.topPerformances.slice(0, 10);
                    }
                }
            }
        }

        // Update metadata
        topParsers.totalLogs = (topParsers.totalLogs || 0) + 1;
        topParsers.generated = new Date().toISOString();
        if (!topParsers.dateRange.from || logDate < topParsers.dateRange.from) {
            topParsers.dateRange.from = logDate;
        }
        if (!topParsers.dateRange.to || logDate > topParsers.dateRange.to) {
            topParsers.dateRange.to = logDate;
        }

        // Save updated data
        fs.writeFileSync('./data/top-parsers.json', JSON.stringify(topParsers, null, 2));

        res.json({
            success: true,
            logId,
            updates,
            message: `Processed ${updates.length} new records`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Get top parsers
app.get('/api/top-parsers', (req, res) => {
    try {
        const data = fs.readFileSync('./data/top-parsers.json', 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.json({ dps: {} });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Admin panel at http://localhost:${PORT}/admin.html`);
});
