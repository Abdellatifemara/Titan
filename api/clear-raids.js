const { kv } = require('@vercel/kv');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'titan2026';
const RAIDS_KEY = 'titan:raids';

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

    const { action } = req.body || {};

    try {
        if (action === 'clear') {
            // Clear all raids
            await kv.set(RAIDS_KEY, []);
            return res.json({ success: true, message: 'All raids cleared' });
        }

        if (action === 'seed') {
            // Seed with the 4 raids from raids.html
            const raids = [
                {
                    id: 'raid-20260126',
                    date: '2026-01-26',
                    raidName: 'ICC 25 HC',
                    status: 'completed',
                    notes: 'LOD 6.2 + GS | 17:00 ST',
                    uwuLogUrl: 'https://uwu-logs.xyz/reports/26-01-26--17-41--Caelestis--Icecrown/',
                    logger: 'Caelestis',
                    bossKills: 12,
                    compositionText: '',
                    composition: { tanks: [], melee: [], ranged: [], healers: [] },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'raid-20260125',
                    date: '2026-01-25',
                    raidName: 'ICC 25 HC',
                    status: 'completed',
                    notes: 'LOD 6.2 + GS | 16:30 ST',
                    uwuLogUrl: 'https://uwu-logs.xyz/reports/26-01-25--10-32--Ellenorqt--Icecrown/',
                    logger: 'Ellenorqt',
                    bossKills: 12,
                    compositionText: '',
                    composition: { tanks: [], melee: [], ranged: [], healers: [] },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'raid-20260124',
                    date: '2026-01-24',
                    raidName: 'ICC 25 HC',
                    status: 'completed',
                    notes: 'LoD',
                    uwuLogUrl: '',
                    logger: '',
                    bossKills: 12,
                    compositionText: '',
                    composition: { tanks: [], melee: [], ranged: [], healers: [] },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'raid-20260123',
                    date: '2026-01-23',
                    raidName: 'ICC 25 HC',
                    status: 'completed',
                    notes: 'LoD',
                    uwuLogUrl: '',
                    logger: '',
                    bossKills: 12,
                    compositionText: '',
                    composition: { tanks: [], melee: [], ranged: [], healers: [] },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];

            await kv.set(RAIDS_KEY, raids);
            return res.json({
                success: true,
                message: `Seeded ${raids.length} raids from raids.html`,
                raids: raids.length
            });
        }

        if (action === 'clear-and-seed') {
            // Clear and seed in one action
            const raids = [
                {
                    id: 'raid-20260126',
                    date: '2026-01-26',
                    raidName: 'ICC 25 HC',
                    status: 'completed',
                    notes: 'LOD 6.2 + GS | 17:00 ST',
                    uwuLogUrl: 'https://uwu-logs.xyz/reports/26-01-26--17-41--Caelestis--Icecrown/',
                    logger: 'Caelestis',
                    bossKills: 12,
                    compositionText: '',
                    composition: { tanks: [], melee: [], ranged: [], healers: [] },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'raid-20260125',
                    date: '2026-01-25',
                    raidName: 'ICC 25 HC',
                    status: 'completed',
                    notes: 'LOD 6.2 + GS | 16:30 ST',
                    uwuLogUrl: 'https://uwu-logs.xyz/reports/26-01-25--10-32--Ellenorqt--Icecrown/',
                    logger: 'Ellenorqt',
                    bossKills: 12,
                    compositionText: '',
                    composition: { tanks: [], melee: [], ranged: [], healers: [] },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'raid-20260124',
                    date: '2026-01-24',
                    raidName: 'ICC 25 HC',
                    status: 'completed',
                    notes: 'LoD',
                    uwuLogUrl: '',
                    logger: '',
                    bossKills: 12,
                    compositionText: '',
                    composition: { tanks: [], melee: [], ranged: [], healers: [] },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'raid-20260123',
                    date: '2026-01-23',
                    raidName: 'ICC 25 HC',
                    status: 'completed',
                    notes: 'LoD',
                    uwuLogUrl: '',
                    logger: '',
                    bossKills: 12,
                    compositionText: '',
                    composition: { tanks: [], melee: [], ranged: [], healers: [] },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];

            await kv.set(RAIDS_KEY, raids);
            return res.json({
                success: true,
                message: `Cleared and seeded ${raids.length} raids`,
                raids: raids.length
            });
        }

        return res.status(400).json({
            error: 'Invalid action. Use: clear, seed, or clear-and-seed'
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
