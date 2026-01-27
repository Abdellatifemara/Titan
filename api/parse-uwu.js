const { kv } = require('@vercel/kv');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'titan2026';
const TOP_PARSERS_KEY = 'titan:top-parsers';
const PROCESSED_LOGS_KEY = 'titan:logs-processed';
const RAIDS_KEY = 'titan:raids';

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const password = req.headers['x-admin-password'];
    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { logUrl, manualComposition, raidId } = req.body;

        // Handle manual composition paste (fallback)
        if (manualComposition && raidId) {
            return await handleManualComposition(req, res, manualComposition, raidId);
        }

        if (!logUrl) {
            return res.status(400).json({ error: 'logUrl or manualComposition required' });
        }

        // Extract log ID from URL
        const reportsMatch = logUrl.match(/\/reports\/([^\/]+)/);
        const logMatch = logUrl.match(/\/log\/([a-zA-Z0-9]+)/);

        let logId;
        if (reportsMatch) {
            logId = reportsMatch[1];
        } else if (logMatch) {
            logId = logMatch[1];
        } else {
            return res.status(400).json({ error: 'Invalid UwU logs URL format' });
        }

        // Check if already processed
        const processedLogs = await kv.get(PROCESSED_LOGS_KEY) || [];
        const alreadyProcessed = processedLogs.includes(logId);

        // Try to fetch and parse the log
        let logData = null;
        let parseMethod = 'api';

        // Try UwU Logs API first
        try {
            const apiUrl = `https://uwu-logs.xyz/api/reports/${logId}`;
            const response = await fetch(apiUrl, {
                headers: { 'Accept': 'application/json' }
            });
            if (response.ok) {
                logData = await response.json();
            }
        } catch (e) {
            console.log('API fetch failed, trying HTML scrape');
        }

        // Fallback: Try HTML scraping
        if (!logData) {
            try {
                const htmlUrl = `https://uwu-logs.xyz/reports/${logId}/`;
                const htmlResponse = await fetch(htmlUrl);
                if (htmlResponse.ok) {
                    const html = await htmlResponse.text();
                    logData = parseHtmlLog(html, logId);
                    parseMethod = 'html';
                }
            } catch (e) {
                console.log('HTML scrape failed');
            }
        }

        // If we couldn't fetch data, return guidance for manual entry
        if (!logData) {
            return res.json({
                success: false,
                logId,
                error: 'Could not automatically fetch log data',
                fallback: true,
                message: 'Please use the manual composition paste feature',
                tip: 'Copy the raid composition from the UwU logs page and paste it in the admin panel'
            });
        }

        // Process the log data and update top parsers
        const updates = await processLogData(logData, logId);

        // Mark log as processed
        if (!alreadyProcessed) {
            processedLogs.push(logId);
            await kv.set(PROCESSED_LOGS_KEY, processedLogs);
        }

        // Extract composition if available
        const composition = extractComposition(logData);

        return res.json({
            success: true,
            logId,
            parseMethod,
            alreadyProcessed,
            updates,
            composition,
            message: `Parsed ${updates.length} new records from log`,
            raidInfo: {
                date: logData.date || extractDateFromLogId(logId),
                raid: logData.zone || 'Icecrown Citadel',
                bossKills: logData.encounters?.length || 0
            }
        });

    } catch (error) {
        console.error('Parse UwU error:', error);
        return res.status(500).json({ error: error.message });
    }
};

// Handle manual composition paste
async function handleManualComposition(req, res, compositionText, raidId) {
    const composition = parseDiscordComposition(compositionText);

    // Update the raid with the composition
    const raids = await kv.get(RAIDS_KEY) || [];
    const raidIndex = raids.findIndex(r => r.id === raidId);

    if (raidIndex !== -1) {
        raids[raidIndex].composition = composition;
        raids[raidIndex].compositionText = compositionText;
        raids[raidIndex].updatedAt = new Date().toISOString();
        await kv.set(RAIDS_KEY, raids);
    }

    return res.json({
        success: true,
        composition,
        message: 'Composition parsed and saved',
        playerCount: Object.values(composition).flat().length
    });
}

// Parse Discord-style composition text
function parseDiscordComposition(text) {
    const composition = {
        tanks: [],
        melee: [],
        ranged: [],
        healers: []
    };

    const lines = text.replace(/\r/g, '').split('\n');
    let currentRole = null;

    const rolePatterns = {
        tanks: /-?\s*(tanks?)\s*-?/i,
        melee: /-?\s*(melee|meele)\s*(dps)?\s*-?/i,
        ranged: /-?\s*(ranged?|range)\s*(dps)?\s*-?/i,
        healers: /-?\s*(healers?|heals?)\s*-?/i
    };

    const classMap = {
        'dk': 'Death Knight', 'death knight': 'Death Knight',
        'blood': 'Death Knight', 'frost': 'Death Knight', 'unholy': 'Death Knight',
        'druid': 'Druid', 'feral': 'Druid', 'balance': 'Druid', 'resto': 'Druid', 'boomkin': 'Druid',
        'hunter': 'Hunter', 'mm': 'Hunter', 'surv': 'Hunter', 'bm': 'Hunter',
        'mage': 'Mage', 'fire': 'Mage', 'arcane': 'Mage',
        'paladin': 'Paladin', 'pala': 'Paladin', 'ret': 'Paladin', 'prot': 'Paladin', 'holy': 'Paladin', 'protection': 'Paladin',
        'priest': 'Priest', 'shadow': 'Priest', 'disc': 'Priest',
        'rogue': 'Rogue', 'assa': 'Rogue', 'combat': 'Rogue',
        'shaman': 'Shaman', 'ele': 'Shaman', 'enhance': 'Shaman', 'enh': 'Shaman',
        'warlock': 'Warlock', 'lock': 'Warlock', 'affli': 'Warlock', 'destro': 'Warlock',
        'warrior': 'Warrior', 'warr': 'Warrior', 'arms': 'Warrior', 'fury': 'Warrior'
    };

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const lowerLine = trimmed.toLowerCase();

        // Check for role headers
        for (const [role, pattern] of Object.entries(rolePatterns)) {
            if (pattern.test(trimmed)) {
                currentRole = role;
                break;
            }
        }

        // Extract @ mentions
        const mentions = trimmed.match(/@(\w+)/g);
        if (mentions && currentRole) {
            for (const mention of mentions) {
                const playerName = mention.replace('@', '');
                let playerClass = 'Unknown';

                for (const [keyword, cls] of Object.entries(classMap)) {
                    if (lowerLine.includes(keyword)) {
                        playerClass = cls;
                        break;
                    }
                }

                composition[currentRole].push({
                    name: playerName,
                    class: playerClass
                });
            }
        }
    }

    return composition;
}

// Process log data and update top parsers
async function processLogData(logData, logId) {
    const updates = [];

    // Get current top parsers data
    let topParsers = await kv.get(TOP_PARSERS_KEY) || {
        dps: {},
        hps: {},
        totalLogs: 0,
        dateRange: { from: null, to: null },
        generated: new Date().toISOString()
    };

    const logDate = logData.date || extractDateFromLogId(logId);

    // Update date range
    if (!topParsers.dateRange.from || logDate < topParsers.dateRange.from) {
        topParsers.dateRange.from = logDate;
    }
    if (!topParsers.dateRange.to || logDate > topParsers.dateRange.to) {
        topParsers.dateRange.to = logDate;
    }

    // Process encounters
    if (logData.encounters) {
        for (const encounter of logData.encounters) {
            const bossName = normalizeBossName(encounter.boss || encounter.name);
            if (!bossName) continue;

            // Initialize boss entry if needed
            if (!topParsers.dps[bossName]) {
                topParsers.dps[bossName] = [];
            }
            if (!topParsers.hps[bossName]) {
                topParsers.hps[bossName] = [];
            }

            // Process players in this encounter
            const players = encounter.players || encounter.damage || [];
            for (const player of players) {
                const playerName = player.name || player.player;
                const playerClass = normalizeClassName(player.class || player.spec);
                const dps = player.dps || player.damage_per_second || 0;
                const hps = player.hps || player.healing_per_second || 0;

                if (dps > 0) {
                    const newRecord = {
                        player: playerName,
                        class: playerClass,
                        dps: Math.round(dps),
                        date: logDate,
                        logId
                    };

                    // Check if this is a new top parse
                    const existingTop = topParsers.dps[bossName].find(p => p.player === playerName);
                    if (!existingTop || dps > existingTop.dps) {
                        // Remove old record if exists
                        topParsers.dps[bossName] = topParsers.dps[bossName].filter(p => p.player !== playerName);
                        topParsers.dps[bossName].push(newRecord);

                        // Sort by DPS descending
                        topParsers.dps[bossName].sort((a, b) => b.dps - a.dps);

                        // Keep only top 10
                        topParsers.dps[bossName] = topParsers.dps[bossName].slice(0, 10);

                        updates.push({
                            type: 'dps',
                            boss: bossName,
                            old: existingTop,
                            new: newRecord
                        });
                    }
                }

                if (hps > 0) {
                    const newRecord = {
                        player: playerName,
                        class: playerClass,
                        hps: Math.round(hps),
                        date: logDate,
                        logId
                    };

                    const existingTop = topParsers.hps[bossName].find(p => p.player === playerName);
                    if (!existingTop || hps > existingTop.hps) {
                        topParsers.hps[bossName] = topParsers.hps[bossName].filter(p => p.player !== playerName);
                        topParsers.hps[bossName].push(newRecord);
                        topParsers.hps[bossName].sort((a, b) => b.hps - a.hps);
                        topParsers.hps[bossName] = topParsers.hps[bossName].slice(0, 10);

                        updates.push({
                            type: 'hps',
                            boss: bossName,
                            old: existingTop,
                            new: newRecord
                        });
                    }
                }
            }
        }
    }

    // Update totals and save
    topParsers.totalLogs = (topParsers.totalLogs || 0) + 1;
    topParsers.generated = new Date().toISOString();

    await kv.set(TOP_PARSERS_KEY, topParsers);

    return updates;
}

// Parse HTML log page (fallback method)
function parseHtmlLog(html, logId) {
    const data = {
        date: extractDateFromLogId(logId),
        zone: 'Icecrown Citadel',
        encounters: []
    };

    // Extract player names and DPS from HTML tables
    // This is a simplified parser - adjust based on actual HTML structure
    const playerMatches = html.matchAll(/<tr[^>]*>.*?<td[^>]*>([^<]+)<\/td>.*?<td[^>]*class="[^"]*dps[^"]*"[^>]*>([0-9,]+)<\/td>/gis);

    const players = [];
    for (const match of playerMatches) {
        const name = match[1].trim();
        const dps = parseInt(match[2].replace(/,/g, ''), 10);
        if (name && dps > 0) {
            players.push({ name, dps, class: 'Unknown' });
        }
    }

    if (players.length > 0) {
        data.encounters.push({
            boss: 'Combined',
            players
        });
    }

    return data;
}

// Extract composition from log data
function extractComposition(logData) {
    const composition = {
        tanks: [],
        melee: [],
        ranged: [],
        healers: []
    };

    if (!logData.encounters || logData.encounters.length === 0) {
        return composition;
    }

    // Get unique players from all encounters
    const seenPlayers = new Set();

    for (const encounter of logData.encounters) {
        const players = encounter.players || [];

        for (const player of players) {
            const name = player.name || player.player;
            if (seenPlayers.has(name)) continue;
            seenPlayers.add(name);

            const role = player.role || detectRole(player);
            const playerClass = normalizeClassName(player.class || player.spec);

            const playerEntry = { name, class: playerClass };

            switch (role) {
                case 'tank':
                    composition.tanks.push(playerEntry);
                    break;
                case 'healer':
                    composition.healers.push(playerEntry);
                    break;
                case 'melee':
                    composition.melee.push(playerEntry);
                    break;
                case 'ranged':
                default:
                    composition.ranged.push(playerEntry);
                    break;
            }
        }
    }

    return composition;
}

// Detect player role from their stats
function detectRole(player) {
    if (player.role) return player.role.toLowerCase();

    const hps = player.hps || 0;
    const dps = player.dps || 0;
    const tanked = player.tanked || player.damage_taken_tanked || false;

    if (tanked) return 'tank';
    if (hps > dps) return 'healer';

    // Check spec for melee/ranged
    const spec = (player.spec || '').toLowerCase();
    const meleeSpecs = ['arms', 'fury', 'combat', 'assassination', 'subtlety', 'feral', 'enhance', 'ret', 'frost dk', 'unholy'];
    const rangedSpecs = ['arcane', 'fire', 'frost mage', 'balance', 'shadow', 'elemental', 'destruction', 'affliction', 'demonology', 'marksman', 'survival', 'beast'];

    for (const s of meleeSpecs) {
        if (spec.includes(s)) return 'melee';
    }
    for (const s of rangedSpecs) {
        if (spec.includes(s)) return 'ranged';
    }

    return 'ranged';
}

// Extract date from log ID (format: YY-MM-DD--HH-MM--Name--Server)
function extractDateFromLogId(logId) {
    const match = logId.match(/^(\d{2})-(\d{2})-(\d{2})/);
    if (match) {
        return `20${match[1]}-${match[2]}-${match[3]}`;
    }
    return new Date().toISOString().split('T')[0];
}

// Normalize boss names
function normalizeBossName(name) {
    if (!name) return null;

    const bossMap = {
        'lord marrowgar': 'Lord Marrowgar',
        'marrowgar': 'Lord Marrowgar',
        'lady deathwhisper': 'Lady Deathwhisper',
        'deathwhisper': 'Lady Deathwhisper',
        'gunship': 'Gunship Battle',
        'gunship battle': 'Gunship Battle',
        'deathbringer saurfang': 'Deathbringer Saurfang',
        'saurfang': 'Deathbringer Saurfang',
        'festergut': 'Festergut',
        'rotface': 'Rotface',
        'professor putricide': 'Professor Putricide',
        'putricide': 'Professor Putricide',
        'blood prince council': 'Blood Prince Council',
        'princes': 'Blood Prince Council',
        'blood queen': 'Blood-Queen Lana\'thel',
        'blood-queen lana\'thel': 'Blood-Queen Lana\'thel',
        'lanathel': 'Blood-Queen Lana\'thel',
        'valithria dreamwalker': 'Valithria Dreamwalker',
        'dreamwalker': 'Valithria Dreamwalker',
        'valithria': 'Valithria Dreamwalker',
        'sindragosa': 'Sindragosa',
        'the lich king': 'The Lich King',
        'lich king': 'The Lich King',
        'lk': 'The Lich King',
        'halion': 'Halion',
        'saviana': 'Saviana Ragefire',
        'baltharus': 'Baltharus the Warborn',
        'zarithrian': 'General Zarithrian'
    };

    const lower = name.toLowerCase().trim();
    return bossMap[lower] || name;
}

// Normalize class names
function normalizeClassName(className) {
    if (!className) return 'Unknown';

    const classMap = {
        'dk': 'Death Knight',
        'death knight': 'Death Knight',
        'deathknight': 'Death Knight',
        'druid': 'Druid',
        'hunter': 'Hunter',
        'mage': 'Mage',
        'paladin': 'Paladin',
        'priest': 'Priest',
        'rogue': 'Rogue',
        'shaman': 'Shaman',
        'warlock': 'Warlock',
        'warrior': 'Warrior'
    };

    const lower = className.toLowerCase().trim();
    return classMap[lower] || className;
}
