// STAGING: Vercel KV version of raids API
// This file is NOT in production yet

const { kv } = require('@vercel/kv');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'titan2026';

// Parse Discord composition format
function parseComposition(text) {
    const composition = { tanks: [], melee: [], ranged: [], healers: [] };

    const classMap = {
        'dk': 'Death Knight', 'death knight': 'Death Knight', 'protection': 'Paladin',
        'unholy': 'Death Knight', 'fury': 'Warrior', 'ret': 'Paladin', 'combat': 'Rogue',
        'feral': 'Druid', 'boomie': 'Druid', 'boomy': 'Druid', 'mm': 'Hunter',
        'fire': 'Mage', 'arcane': 'Mage', 'demo': 'Warlock', 'demonology': 'Warlock',
        'affliction': 'Warlock', 'destro': 'Warlock', 'shadow': 'Priest',
        'holy': 'Paladin', 'disco': 'Priest', 'discipline': 'Priest',
        'shamanresto': 'Shaman', 'restoration': 'Shaman', 'resto': 'Shaman'
    };

    const specMap = {
        'dk': 'Blood', 'death knight tank': 'Blood', 'protection': 'Protection',
        'unholy': 'Unholy', 'fury': 'Fury', 'ret': 'Retribution', 'combat': 'Combat',
        'feral': 'Feral', 'boomie': 'Balance', 'boomy': 'Balance', 'mm': 'Marksmanship',
        'fire': 'Fire', 'arcane': 'Arcane', 'demo': 'Demonology', 'shadow': 'Shadow',
        'holy': 'Holy', 'disco': 'Discipline', 'discipline': 'Discipline',
        'shamanresto': 'Restoration', 'resto': 'Restoration'
    };

    let currentSection = null;
    const lines = text.split('\n');

    for (const line of lines) {
        const lower = line.toLowerCase();

        if (lower.includes('-tanks-') || lower.includes('tanks')) {
            currentSection = 'tanks'; continue;
        } else if (lower.includes('-meele') || lower.includes('-melee') || lower.includes('melee dps')) {
            currentSection = 'melee'; continue;
        } else if (lower.includes('-range') || lower.includes('range dps')) {
            currentSection = 'ranged'; continue;
        } else if (lower.includes('-healer') || lower.includes('healers')) {
            currentSection = 'healers'; continue;
        }

        const playerMatch = line.match(/@([^\s]+)/);
        if (playerMatch && currentSection) {
            let playerName = playerMatch[1].replace(/[^\w]/g, '');
            let playerClass = 'Unknown', playerSpec = 'Unknown';

            for (const [key, value] of Object.entries(classMap)) {
                if (lower.includes(key)) {
                    playerClass = value;
                    playerSpec = specMap[key] || 'Unknown';
                    break;
                }
            }

            if (currentSection && playerName) {
                composition[currentSection].push({ name: playerName, class: playerClass, spec: playerSpec });
            }
        }
    }
    return composition;
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // GET - Load raids from KV
    if (req.method === 'GET') {
        try {
            const raids = await kv.get('titan:raids') || [];
            return res.json({ raids });
        } catch (error) {
            console.error('KV GET error:', error);
            return res.json({ raids: [] });
        }
    }

    // POST - Add new raid
    if (req.method === 'POST') {
        const password = req.headers['x-admin-password'];
        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const { date, raidName, bossKills, logUrl, compositionText, notes, startTime } = req.body;
            const composition = compositionText ? parseComposition(compositionText) : null;

            const newRaid = {
                id: Date.now().toString(),
                date,
                raidName: raidName || 'ICC 25 HC',
                startTime: startTime || '',
                bossKills: bossKills || 12,
                logUrl,
                composition,
                notes,
                createdAt: new Date().toISOString()
            };

            let raids = await kv.get('titan:raids') || [];
            raids.unshift(newRaid);
            await kv.set('titan:raids', raids);

            return res.json({ success: true, raid: newRaid });
        } catch (error) {
            console.error('KV POST error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // DELETE - Remove raid
    if (req.method === 'DELETE') {
        const password = req.headers['x-admin-password'];
        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const { id } = req.body;
            let raids = await kv.get('titan:raids') || [];
            raids = raids.filter(r => r.id !== id);
            await kv.set('titan:raids', raids);
            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
