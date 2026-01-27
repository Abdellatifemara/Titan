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
            // Seed with the 4 raids from raids.html with full compositions
            const raids = getSeedRaids();

            await kv.set(RAIDS_KEY, raids);
            return res.json({
                success: true,
                message: `Seeded ${raids.length} raids from raids.html`,
                raids: raids.length
            });
        }

        if (action === 'clear-and-seed') {
            // Clear and seed in one action
            const raids = getSeedRaids();
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

// Get seed raids with full compositions from original raids.html
function getSeedRaids() {
    const now = new Date().toISOString();
    return [
        {
            id: 'raid-20260126',
            date: '2026-01-26',
            time: '17:00 ST',
            raidName: 'ICC 25 HC',
            status: 'completed',
            notes: 'LOD 6.2 + GS',
            uwuLogUrl: 'https://uwu-logs.xyz/reports/26-01-26--17-41--Caelestis--Icecrown/',
            logger: 'Caelestis',
            bossKills: 12,
            composition: {
                tanks: [
                    { name: 'Kredoring', class: 'Death Knight', spec: 'Blood DK' },
                    { name: 'Chagra', class: 'Paladin', spec: 'Prot' }
                ],
                melee: [
                    { name: 'Bartu', class: 'Death Knight', spec: 'Unholy' },
                    { name: 'Penatrated', class: 'Warrior', spec: 'Fury' },
                    { name: 'Oldmb', class: 'Warrior', spec: 'Fury' },
                    { name: 'CBDCisJail', class: 'Warrior', spec: 'Fury' },
                    { name: 'Hitsu', class: 'Paladin', spec: 'Ret' },
                    { name: 'Waawaa', class: 'Paladin', spec: 'Ret' },
                    { name: 'Ellenor', class: 'Rogue', spec: 'Combat' },
                    { name: 'rf', class: 'Rogue', spec: 'Combat' },
                    { name: 'kaczor', class: 'Druid', spec: 'Feral' }
                ],
                ranged: [
                    { name: 'Rasta', class: 'Druid', spec: 'Boomkin' },
                    { name: 'Djubretarka', class: 'Druid', spec: 'Boomkin' },
                    { name: 'Doloriann', class: 'Hunter', spec: 'MM' },
                    { name: 'Shatzie', class: 'Hunter', spec: 'MM' },
                    { name: 'Verbalabuse', class: 'Mage', spec: 'Fire' },
                    { name: 'Tito', class: 'Mage', spec: 'Fire' },
                    { name: 'Halo', class: 'Mage', spec: 'Fire' },
                    { name: 'Seerhona', class: 'Mage', spec: 'Fire' },
                    { name: 'Tropyco', class: 'Warlock', spec: 'Demo' },
                    { name: 'Schwepsy', class: 'Priest', spec: 'Shadow' },
                    { name: 'Xerxei', class: 'Priest', spec: 'Shadow' }
                ],
                healers: [
                    { name: 'bral', class: 'Paladin', spec: 'Holy' },
                    { name: 'Arius', class: 'Priest', spec: 'Disc' },
                    { name: 'Paadron', class: 'Shaman', spec: 'Resto' }
                ]
            },
            createdAt: now,
            updatedAt: now
        },
        {
            id: 'raid-20260125',
            date: '2026-01-25',
            time: '16:30 ST',
            raidName: 'ICC 25 HC LOD 6.2 + GS',
            status: 'completed',
            notes: '',
            uwuLogUrl: 'https://uwu-logs.xyz/reports/26-01-25--10-32--Ellenorqt--Icecrown/',
            logger: 'Ellenorqt',
            bossKills: 12,
            composition: {
                tanks: [
                    { name: 'Kredoring', class: 'Death Knight', spec: 'Blood DK' },
                    { name: 'Chagra', class: 'Paladin', spec: 'Prot' }
                ],
                melee: [
                    { name: 'Bartu', class: 'Death Knight', spec: 'Unholy' },
                    { name: 'Penatrated', class: 'Warrior', spec: 'Fury' },
                    { name: 'Oldmb', class: 'Warrior', spec: 'Fury' },
                    { name: 'CBDCisJail', class: 'Warrior', spec: 'Fury' },
                    { name: 'Hitsu', class: 'Paladin', spec: 'Ret' },
                    { name: 'Waawaa', class: 'Paladin', spec: 'Ret' },
                    { name: 'Ellenor', class: 'Rogue', spec: 'Combat' },
                    { name: 'rf', class: 'Rogue', spec: 'Combat' },
                    { name: 'kaczor', class: 'Druid', spec: 'Feral' }
                ],
                ranged: [
                    { name: 'Rasta', class: 'Druid', spec: 'Boomkin' },
                    { name: 'Djubretarka', class: 'Druid', spec: 'Boomkin' },
                    { name: 'Doloriann', class: 'Hunter', spec: 'MM' },
                    { name: 'Shatzie', class: 'Hunter', spec: 'MM' },
                    { name: 'Verbalabuse', class: 'Mage', spec: 'Fire' },
                    { name: 'Tito', class: 'Mage', spec: 'Fire' },
                    { name: 'Halo', class: 'Mage', spec: 'Fire' },
                    { name: 'Seerhona', class: 'Mage', spec: 'Fire' },
                    { name: 'Tropyco', class: 'Warlock', spec: 'Demo' },
                    { name: 'Schwepsy', class: 'Priest', spec: 'Shadow' },
                    { name: 'Xerxei', class: 'Priest', spec: 'Shadow' }
                ],
                healers: [
                    { name: 'bral', class: 'Paladin', spec: 'Holy' },
                    { name: 'Arius', class: 'Priest', spec: 'Disc' },
                    { name: 'Paadron', class: 'Shaman', spec: 'Resto' }
                ]
            },
            createdAt: now,
            updatedAt: now
        },
        {
            id: 'raid-20260124',
            date: '2026-01-24',
            time: '19:00 ST',
            raidName: 'ICC 25 HC',
            status: 'completed',
            notes: 'LoD',
            uwuLogUrl: '',
            logger: '',
            bossKills: 12,
            composition: { tanks: [], melee: [], ranged: [], healers: [] },
            createdAt: now,
            updatedAt: now
        },
        {
            id: 'raid-20260123',
            date: '2026-01-23',
            time: '19:00 ST',
            raidName: 'ICC 25 HC',
            status: 'completed',
            notes: 'LoD',
            uwuLogUrl: '',
            logger: '',
            bossKills: 12,
            composition: { tanks: [], melee: [], ranged: [], healers: [] },
            createdAt: now,
            updatedAt: now
        }
    ];
}
