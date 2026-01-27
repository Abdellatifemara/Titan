const { kv } = require('@vercel/kv');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'titan2026';
const RAIDS_KEY = 'titan:raids';

// Helper to generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Helper to check admin auth
function isAuthorized(req) {
    const password = req.headers['x-admin-password'];
    return password === ADMIN_PASSWORD;
}

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // GET - Fetch all raids
        if (req.method === 'GET') {
            const raids = await kv.get(RAIDS_KEY) || [];
            return res.json({
                raids,
                totalRaids: raids.length
            });
        }

        // POST - Create new raid
        if (req.method === 'POST') {
            if (!isAuthorized(req)) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { date, raidName, bossKills, compositionText, composition, uwuLogUrl, notes } = req.body;

            if (!date || !raidName) {
                return res.status(400).json({ error: 'Date and raidName are required' });
            }

            const raids = await kv.get(RAIDS_KEY) || [];

            const newRaid = {
                id: generateId(),
                date,
                raidName,
                bossKills: bossKills || 0,
                composition: composition || parseComposition(compositionText),
                compositionText: compositionText || '',
                uwuLogUrl: uwuLogUrl || '',
                notes: notes || '',
                status: new Date(date) > new Date() ? 'upcoming' : 'completed',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            raids.unshift(newRaid); // Add to beginning (newest first)
            await kv.set(RAIDS_KEY, raids);

            return res.json({
                success: true,
                raid: newRaid,
                message: 'Raid created successfully'
            });
        }

        // PUT - Update existing raid
        if (req.method === 'PUT') {
            if (!isAuthorized(req)) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { id, ...updates } = req.body;

            if (!id) {
                return res.status(400).json({ error: 'Raid ID is required' });
            }

            const raids = await kv.get(RAIDS_KEY) || [];
            const raidIndex = raids.findIndex(r => r.id === id);

            if (raidIndex === -1) {
                return res.status(404).json({ error: 'Raid not found' });
            }

            // Update raid with new data
            raids[raidIndex] = {
                ...raids[raidIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };

            // Re-parse composition if compositionText changed
            if (updates.compositionText && !updates.composition) {
                raids[raidIndex].composition = parseComposition(updates.compositionText);
            }

            await kv.set(RAIDS_KEY, raids);

            return res.json({
                success: true,
                raid: raids[raidIndex],
                message: 'Raid updated successfully'
            });
        }

        // DELETE - Remove raid
        if (req.method === 'DELETE') {
            if (!isAuthorized(req)) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { id } = req.query;

            if (!id) {
                return res.status(400).json({ error: 'Raid ID is required' });
            }

            let raids = await kv.get(RAIDS_KEY) || [];
            const initialLength = raids.length;
            raids = raids.filter(r => r.id !== id);

            if (raids.length === initialLength) {
                return res.status(404).json({ error: 'Raid not found' });
            }

            await kv.set(RAIDS_KEY, raids);

            return res.json({
                success: true,
                message: 'Raid deleted successfully'
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Raids API error:', error);
        return res.status(500).json({
            error: error.message,
            hint: 'Make sure Vercel KV is configured with correct environment variables'
        });
    }
};

// Parse Discord-style composition text into structured data
function parseComposition(text) {
    if (!text) return { tanks: [], melee: [], ranged: [], healers: [] };

    const composition = {
        tanks: [],
        melee: [],
        ranged: [],
        healers: []
    };

    // Normalize text
    const lines = text.toLowerCase().replace(/\r/g, '').split('\n');
    let currentRole = null;

    // Role section markers
    const rolePatterns = {
        tanks: /-?\s*(tanks?|tank)\s*-?/i,
        melee: /-?\s*(melee|meele)\s*(dps)?\s*-?/i,
        ranged: /-?\s*(ranged?|range)\s*(dps)?\s*-?/i,
        healers: /-?\s*(healers?|healer|heals?)\s*-?/i
    };

    // Class patterns
    const classMap = {
        'dk': 'Death Knight', 'death knight': 'Death Knight', 'deathknight': 'Death Knight',
        'blood': 'Death Knight', 'frost': 'Death Knight', 'unholy': 'Death Knight',
        'druid': 'Druid', 'feral': 'Druid', 'balance': 'Druid', 'resto': 'Druid', 'boomkin': 'Druid',
        'hunter': 'Hunter', 'mm': 'Hunter', 'surv': 'Hunter', 'bm': 'Hunter', 'survival': 'Hunter', 'marksman': 'Hunter',
        'mage': 'Mage', 'fire': 'Mage', 'arcane': 'Mage',
        'paladin': 'Paladin', 'pala': 'Paladin', 'ret': 'Paladin', 'prot': 'Paladin', 'holy': 'Paladin', 'protection': 'Paladin',
        'priest': 'Priest', 'shadow': 'Priest', 'disc': 'Priest', 'discipline': 'Priest',
        'rogue': 'Rogue', 'assa': 'Rogue', 'combat': 'Rogue', 'assassination': 'Rogue',
        'shaman': 'Shaman', 'ele': 'Shaman', 'enhance': 'Shaman', 'elemental': 'Shaman', 'enhancement': 'Shaman',
        'warlock': 'Warlock', 'lock': 'Warlock', 'affli': 'Warlock', 'destro': 'Warlock', 'demo': 'Warlock',
        'warrior': 'Warrior', 'warr': 'Warrior', 'arms': 'Warrior', 'fury': 'Warrior'
    };

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Check for role section headers
        for (const [role, pattern] of Object.entries(rolePatterns)) {
            if (pattern.test(trimmed)) {
                currentRole = role;
                break;
            }
        }

        // Extract player names from @ mentions
        const mentions = trimmed.match(/@(\w+)/g);
        if (mentions && currentRole) {
            for (const mention of mentions) {
                const playerName = mention.replace('@', '');

                // Try to detect class from the line
                let playerClass = 'Unknown';
                for (const [keyword, cls] of Object.entries(classMap)) {
                    if (trimmed.includes(keyword)) {
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
