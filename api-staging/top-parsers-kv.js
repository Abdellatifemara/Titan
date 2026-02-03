// STAGING: Vercel KV version of top-parsers API
// This file is NOT in production yet

const { kv } = require('@vercel/kv');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'titan2026';

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // GET - Load top parsers from KV
    if (req.method === 'GET') {
        try {
            const data = await kv.get('titan:top-parsers');
            if (data) {
                return res.json(data);
            }
            return res.json({ dps: {}, hps: {}, totalLogs: 0, dateRange: {}, generated: null });
        } catch (error) {
            console.error('KV GET error:', error);
            return res.json({ dps: {}, hps: {}, totalLogs: 0, dateRange: {}, generated: null });
        }
    }

    // POST - Update top parsers (from admin panel)
    if (req.method === 'POST') {
        const password = req.headers['x-admin-password'];
        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const { action, data } = req.body;

            if (action === 'update') {
                // Full update of top-parsers data
                await kv.set('titan:top-parsers', data);
                return res.json({ success: true });
            }

            if (action === 'increment-logs') {
                // Just increment the log count
                let current = await kv.get('titan:top-parsers') || { totalLogs: 0 };
                current.totalLogs = (current.totalLogs || 0) + 1;
                current.generated = new Date().toISOString();
                if (data.date) {
                    if (!current.dateRange) current.dateRange = {};
                    if (!current.dateRange.from || data.date < current.dateRange.from) {
                        current.dateRange.from = data.date;
                    }
                    if (!current.dateRange.to || data.date > current.dateRange.to) {
                        current.dateRange.to = data.date;
                    }
                }
                await kv.set('titan:top-parsers', current);
                return res.json({ success: true, totalLogs: current.totalLogs });
            }

            return res.status(400).json({ error: 'Invalid action' });
        } catch (error) {
            console.error('KV POST error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
