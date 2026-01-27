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

// Parse composition text into structured data - supports multiple formats
function parseComposition(text) {
    if (!text) return { tanks: [], melee: [], ranged: [], healers: [] };

    const composition = {
        tanks: [],
        melee: [],
        ranged: [],
        healers: []
    };

    // Normalize text
    const lines = text.replace(/\r/g, '').split('\n');
    let currentRole = null;

    // Role section markers (case insensitive) - more lenient matching
    const rolePatterns = {
        tanks: /[-]*\s*tanks?\s*[-]*/i,
        melee: /[-]*\s*(melee|meele)\s*(dps)?\s*[-]*/i,
        ranged: /[-]*\s*(ranged?|range)\s*(dps)?\s*[-]*/i,
        healers: /[-]*\s*(healers?|healer|heals?)\s*[-]*/i
    };

    // Spec to role mapping
    const specRoles = {
        // Tanks
        'blood': 'tanks', 'prot': 'tanks', 'protection': 'tanks', 'bear': 'tanks', 'feral tank': 'tanks',
        // Melee DPS
        'fury': 'melee', 'arms': 'melee', 'ret': 'melee', 'retribution': 'melee',
        'combat': 'melee', 'assa': 'melee', 'assassination': 'melee', 'subtlety': 'melee',
        'unholy': 'melee', 'frost dk': 'melee', 'feral': 'melee', 'feral cat': 'melee', 'cat': 'melee',
        'enhance': 'melee', 'enhancement': 'melee',
        // Ranged DPS
        'mm': 'ranged', 'marksman': 'ranged', 'marksmanship': 'ranged', 'surv': 'ranged', 'survival': 'ranged', 'bm': 'ranged',
        'fire': 'ranged', 'arcane': 'ranged', 'frost mage': 'ranged',
        'shadow': 'ranged', 'spriest': 'ranged',
        'balance': 'ranged', 'boomkin': 'ranged', 'moonkin': 'ranged', 'boomy': 'ranged',
        'ele': 'ranged', 'elemental': 'ranged',
        'affli': 'ranged', 'affliction': 'ranged', 'demo': 'ranged', 'demonology': 'ranged', 'destro': 'ranged', 'destruction': 'ranged',
        // Healers
        'holy': 'healers', 'disc': 'healers', 'discipline': 'healers',
        'resto': 'healers', 'restoration': 'healers', 'rsham': 'healers', 'rdruid': 'healers',
        'hpal': 'healers', 'hpriest': 'healers'
    };

    // Class patterns
    const classMap = {
        'dk': 'Death Knight', 'death knight': 'Death Knight', 'deathknight': 'Death Knight',
        'blood': 'Death Knight', 'unholy': 'Death Knight',
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
        let isRoleHeader = false;
        for (const [role, pattern] of Object.entries(rolePatterns)) {
            if (pattern.test(trimmed)) {
                currentRole = role;
                isRoleHeader = true;
                break;
            }
        }
        if (isRoleHeader) continue;

        // Try to extract player names - multiple formats supported
        // Format 1: @PlayerName
        // Format 2: Plain name (one per line or after role markers)
        // Format 3: emoji :class: Name - @mention

        const lineLower = trimmed.toLowerCase();

        // Try @mentions first - handle special chars in names
        const mentions = trimmed.match(/@[\w\[\]\$\(\)]+/g);
        if (mentions) {
            for (const mention of mentions) {
                // Clean up the name - remove @ and special chars
                let playerName = mention.replace('@', '').replace(/[\[\]\$\(\)]/g, '');
                let playerClass = 'Unknown';
                let detectedRole = currentRole;

                // Detect class and role from line context
                for (const [keyword, cls] of Object.entries(classMap)) {
                    if (lineLower.includes(keyword)) {
                        playerClass = cls;
                        break;
                    }
                }

                // Try to detect role from spec if no current role
                if (!detectedRole) {
                    for (const [spec, role] of Object.entries(specRoles)) {
                        if (lineLower.includes(spec)) {
                            detectedRole = role;
                            break;
                        }
                    }
                }

                if (detectedRole) {
                    composition[detectedRole].push({ name: playerName, class: playerClass });
                }
            }
        }
        // No @mentions - try plain name (single word/name per line under a role header)
        else if (currentRole && trimmed.length > 0 && trimmed.length < 30) {
            // Skip lines that look like headers or descriptions
            if (!/^[-:=*#]/.test(trimmed) && !/^\d+\s*(players?|ppl)/.test(lineLower)) {
                // Extract just the name part - might be "PlayerName" or "PlayerName - spec"
                let playerName = trimmed.split(/[-–—]/)[0].trim();
                // Remove any emojis or special chars at start
                playerName = playerName.replace(/^[:\s\w]*:\s*/, '').trim();
                // If it looks like a name (alphanumeric, reasonable length)
                if (playerName && /^[a-zA-Z][\w]{1,15}$/.test(playerName)) {
                    let playerClass = 'Unknown';
                    for (const [keyword, cls] of Object.entries(classMap)) {
                        if (lineLower.includes(keyword)) {
                            playerClass = cls;
                            break;
                        }
                    }
                    composition[currentRole].push({ name: playerName, class: playerClass });
                }
            }
        }
    }

    return composition;
}
