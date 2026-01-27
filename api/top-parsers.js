const { kv } = require('@vercel/kv');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'titan2026';
const TOP_PARSERS_KEY = 'titan:top-parsers';

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // GET - Fetch top parsers data
        if (req.method === 'GET') {
            let data = await kv.get(TOP_PARSERS_KEY);

            // If no data in KV, return default structure
            if (!data) {
                data = {
                    dps: {},
                    hps: {},
                    totalLogs: 0,
                    dateRange: { from: null, to: null },
                    generated: new Date().toISOString()
                };
            }

            return res.json(data);
        }

        // POST - Update top parsers data (admin only)
        if (req.method === 'POST') {
            const password = req.headers['x-admin-password'];
            if (password !== ADMIN_PASSWORD) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { action, boss, playerData, type } = req.body;

            // Get current data
            let data = await kv.get(TOP_PARSERS_KEY) || {
                dps: {},
                hps: {},
                totalLogs: 0,
                dateRange: { from: null, to: null },
                generated: new Date().toISOString()
            };

            // Handle different actions
            switch (action) {
                case 'add':
                    // Add a new parser record
                    if (!boss || !playerData || !type) {
                        return res.status(400).json({ error: 'boss, playerData, and type are required' });
                    }

                    if (type !== 'dps' && type !== 'hps') {
                        return res.status(400).json({ error: 'type must be dps or hps' });
                    }

                    if (!data[type][boss]) {
                        data[type][boss] = [];
                    }

                    // Check if player already exists
                    const existingIndex = data[type][boss].findIndex(p => p.player === playerData.player);
                    if (existingIndex !== -1) {
                        // Update if new value is higher
                        const metric = type === 'dps' ? 'dps' : 'hps';
                        if (playerData[metric] > data[type][boss][existingIndex][metric]) {
                            data[type][boss][existingIndex] = {
                                ...playerData,
                                date: playerData.date || new Date().toISOString().split('T')[0]
                            };
                        }
                    } else {
                        data[type][boss].push({
                            ...playerData,
                            date: playerData.date || new Date().toISOString().split('T')[0]
                        });
                    }

                    // Sort and keep top 10
                    const sortKey = type === 'dps' ? 'dps' : 'hps';
                    data[type][boss].sort((a, b) => b[sortKey] - a[sortKey]);
                    data[type][boss] = data[type][boss].slice(0, 10);

                    break;

                case 'remove':
                    // Remove a player's record
                    if (!boss || !playerData?.player || !type) {
                        return res.status(400).json({ error: 'boss, playerData.player, and type are required' });
                    }

                    if (data[type][boss]) {
                        data[type][boss] = data[type][boss].filter(p => p.player !== playerData.player);
                    }
                    break;

                case 'clear':
                    // Clear all data for a boss
                    if (!boss) {
                        return res.status(400).json({ error: 'boss is required' });
                    }

                    if (type) {
                        data[type][boss] = [];
                    } else {
                        data.dps[boss] = [];
                        data.hps[boss] = [];
                    }
                    break;

                case 'reset':
                    // Reset all data
                    data = {
                        dps: {},
                        hps: {},
                        totalLogs: 0,
                        dateRange: { from: null, to: null },
                        generated: new Date().toISOString()
                    };
                    break;

                case 'import':
                    // Import full data set
                    if (req.body.data) {
                        data = {
                            ...req.body.data,
                            generated: new Date().toISOString()
                        };
                    }
                    break;

                default:
                    return res.status(400).json({ error: 'Invalid action. Use: add, remove, clear, reset, or import' });
            }

            // Update timestamp
            data.generated = new Date().toISOString();

            // Save to KV
            await kv.set(TOP_PARSERS_KEY, data);

            return res.json({
                success: true,
                action,
                message: `Action '${action}' completed successfully`
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Top parsers API error:', error);
        return res.status(500).json({
            error: error.message,
            hint: 'Make sure Vercel KV is configured with correct environment variables'
        });
    }
};
