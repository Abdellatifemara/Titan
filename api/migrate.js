const { kv } = require('@vercel/kv');
const fs = require('fs');
const path = require('path');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'titan2026';
const RAIDS_KEY = 'titan:raids';
const TOP_PARSERS_KEY = 'titan:top-parsers';
const PROCESSED_LOGS_KEY = 'titan:logs-processed';
const MEMBERS_KEY = 'titan:members';

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // GET - Check migration status
    if (req.method === 'GET') {
        try {
            const raids = await kv.get(RAIDS_KEY) || [];
            const members = await kv.get(MEMBERS_KEY) || [];
            const topParsers = await kv.get(TOP_PARSERS_KEY);
            const processedLogs = await kv.get(PROCESSED_LOGS_KEY) || [];

            return res.json({
                status: 'ok',
                data: {
                    raids: raids.length,
                    members: members.length,
                    topParsers: topParsers ? Object.keys(topParsers.dps || {}).length : 0,
                    processedLogs: processedLogs.length
                }
            });
        } catch (error) {
            return res.json({ status: 'error', error: error.message });
        }
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const password = req.headers['x-admin-password'];
    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { action } = req.body || {};

    try {
        const results = {
            raids: { migrated: 0, error: null },
            members: { migrated: 0, error: null },
            topParsers: { migrated: false, error: null },
            processedLogs: { migrated: 0, error: null }
        };

        // Migrate raid-logs.json
        if (!action || action === 'all' || action === 'raids') {
            try {
                const raidLogsPath = path.join(process.cwd(), 'raid-logs.json');
                if (fs.existsSync(raidLogsPath)) {
                    const rawData = fs.readFileSync(raidLogsPath, 'utf8');
                    const data = JSON.parse(rawData);

                    const raids = (data.logs || []).map((log, index) => ({
                        id: `log-${log.date}-${index}`,
                        date: log.date,
                        raidName: log.raid === 'Icecrown' ? 'ICC 25 HC' : log.raid === 'Ruby Sanctum' ? 'RS 25 HC' : log.raid,
                        bossKills: 12,
                        composition: { tanks: [], melee: [], ranged: [], healers: [] },
                        compositionText: '',
                        uwuLogUrl: log.url,
                        notes: log.note || '',
                        status: 'completed',
                        logger: log.logger,
                        postedBy: log.postedBy || log.logger,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }));

                    // Sort by date descending (newest first)
                    raids.sort((a, b) => new Date(b.date) - new Date(a.date));

                    await kv.set(RAIDS_KEY, raids);
                    results.raids.migrated = raids.length;

                    // Store processed log IDs
                    const processedLogIds = (data.logs || []).map(log => {
                        const match = log.url.match(/\/reports\/([^\/]+)/);
                        return match ? match[1].replace(/\/$/, '') : null;
                    }).filter(Boolean);

                    await kv.set(PROCESSED_LOGS_KEY, processedLogIds);
                    results.processedLogs.migrated = processedLogIds.length;
                }
            } catch (e) {
                results.raids.error = e.message;
            }
        }

        // Migrate members from guild-data.js
        if (!action || action === 'all' || action === 'members') {
            try {
                const guildDataPath = path.join(process.cwd(), 'guild-data.js');
                if (fs.existsSync(guildDataPath)) {
                    const rawData = fs.readFileSync(guildDataPath, 'utf8');

                    // Parse the JavaScript array
                    const memberMatches = rawData.matchAll(/\{\s*name:\s*'([^']+)',\s*class:\s*'([^']+)',\s*level:\s*(\d+),\s*rank:\s*(\d+)\s*\}/g);

                    const members = [];
                    let index = 0;
                    for (const match of memberMatches) {
                        members.push({
                            id: `member-${index++}`,
                            name: match[1],
                            class: match[2],
                            level: parseInt(match[3]),
                            rank: parseInt(match[4]),
                            spec: '',
                            notes: '',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        });
                    }

                    // Sort by rank then name
                    members.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));

                    await kv.set(MEMBERS_KEY, members);
                    results.members.migrated = members.length;
                }
            } catch (e) {
                results.members.error = e.message;
            }
        }

        // Migrate top-parsers.json
        if (!action || action === 'all' || action === 'topParsers') {
            try {
                const topParsersPath = path.join(process.cwd(), 'data', 'top-parsers.json');
                if (fs.existsSync(topParsersPath)) {
                    const rawData = fs.readFileSync(topParsersPath, 'utf8');
                    const data = JSON.parse(rawData);

                    // Keep the same format, just store it
                    const transformedData = {
                        dps: data.dps || {},
                        hps: data.hps || {},
                        totalLogs: data.totalLogs || 0,
                        dateRange: data.dateRange || { from: null, to: null },
                        generated: new Date().toISOString()
                    };

                    await kv.set(TOP_PARSERS_KEY, transformedData);
                    results.topParsers.migrated = true;
                }
            } catch (e) {
                results.topParsers.error = e.message;
            }
        }

        return res.json({
            success: true,
            message: 'Migration completed',
            results
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
