const { kv } = require('@vercel/kv');
const fs = require('fs');
const path = require('path');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'titan2026';
const RAIDS_KEY = 'titan:raids';
const TOP_PARSERS_KEY = 'titan:top-parsers';
const PROCESSED_LOGS_KEY = 'titan:logs-processed';

module.exports = async (req, res) => {
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
        const results = {
            raids: { migrated: 0, error: null },
            topParsers: { migrated: false, error: null },
            processedLogs: { migrated: 0, error: null }
        };

        // Migrate raid-logs.json
        try {
            const raidLogsPath = path.join(process.cwd(), 'raid-logs.json');
            if (fs.existsSync(raidLogsPath)) {
                const rawData = fs.readFileSync(raidLogsPath, 'utf8');
                const data = JSON.parse(rawData);

                const raids = (data.logs || []).map((log, index) => ({
                    id: `migrated-${index}-${Date.now()}`,
                    date: log.date,
                    raidName: log.raid === 'Icecrown' ? 'ICC 25 HC' : log.raid === 'Ruby Sanctum' ? 'RS 25 HC' : log.raid,
                    bossKills: 12,
                    composition: { tanks: [], melee: [], ranged: [], healers: [] },
                    compositionText: '',
                    uwuLogUrl: log.url,
                    notes: log.note || `Logged by ${log.logger}`,
                    status: 'completed',
                    logger: log.logger,
                    postedBy: log.postedBy || log.logger,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }));

                await kv.set(RAIDS_KEY, raids);
                results.raids.migrated = raids.length;

                // Store processed log IDs
                const processedLogIds = (data.logs || []).map(log => {
                    const match = log.url.match(/\/reports\/([^\/]+)/);
                    return match ? match[1] : null;
                }).filter(Boolean);

                await kv.set(PROCESSED_LOGS_KEY, processedLogIds);
                results.processedLogs.migrated = processedLogIds.length;
            }
        } catch (e) {
            results.raids.error = e.message;
        }

        // Migrate top-parsers.json
        try {
            const topParsersPath = path.join(process.cwd(), 'data', 'top-parsers.json');
            if (fs.existsSync(topParsersPath)) {
                const rawData = fs.readFileSync(topParsersPath, 'utf8');
                const data = JSON.parse(rawData);

                // Transform to simpler format
                const transformedData = {
                    dps: {},
                    hps: {},
                    totalLogs: data.totalLogs || 0,
                    dateRange: data.dateRange || { from: null, to: null },
                    generated: new Date().toISOString()
                };

                // Transform DPS data
                if (data.dps) {
                    for (const [bossName, bossData] of Object.entries(data.dps)) {
                        if (bossData.topPerformances && Array.isArray(bossData.topPerformances)) {
                            transformedData.dps[bossName] = bossData.topPerformances.slice(0, 10);
                        } else if (bossData.bestByClass) {
                            transformedData.dps[bossName] = Object.values(bossData.bestByClass)
                                .filter(p => p && p.player)
                                .sort((a, b) => (b.dps || 0) - (a.dps || 0))
                                .slice(0, 10);
                        }
                    }
                }

                // Transform HPS data
                if (data.hps) {
                    for (const [bossName, bossData] of Object.entries(data.hps)) {
                        if (bossData.topPerformances && Array.isArray(bossData.topPerformances)) {
                            transformedData.hps[bossName] = bossData.topPerformances.slice(0, 10);
                        } else if (bossData.bestByClass) {
                            transformedData.hps[bossName] = Object.values(bossData.bestByClass)
                                .filter(p => p && p.player)
                                .sort((a, b) => (b.hps || 0) - (a.hps || 0))
                                .slice(0, 10);
                        }
                    }
                }

                await kv.set(TOP_PARSERS_KEY, transformedData);
                results.topParsers.migrated = true;
            }
        } catch (e) {
            results.topParsers.error = e.message;
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
