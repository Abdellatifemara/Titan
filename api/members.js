const { kv } = require('@vercel/kv');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'titan2026';
const MEMBERS_KEY = 'titan:members';

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function isAuthorized(req) {
    const password = req.headers['x-admin-password'];
    return password === ADMIN_PASSWORD;
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // GET - Fetch all members
        if (req.method === 'GET') {
            const members = await kv.get(MEMBERS_KEY) || [];
            return res.json({
                members,
                totalMembers: members.length,
                byClass: countByClass(members),
                byRank: countByRank(members)
            });
        }

        // POST - Add new member
        if (req.method === 'POST') {
            if (!isAuthorized(req)) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { name, class: playerClass, level, rank, spec, notes } = req.body;

            if (!name || !playerClass) {
                return res.status(400).json({ error: 'Name and class are required' });
            }

            const members = await kv.get(MEMBERS_KEY) || [];

            // Check for duplicate
            if (members.find(m => m.name.toLowerCase() === name.toLowerCase())) {
                return res.status(400).json({ error: 'Member with this name already exists' });
            }

            const newMember = {
                id: generateId(),
                name,
                class: playerClass,
                level: level || 80,
                rank: rank || 4,
                spec: spec || '',
                notes: notes || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            members.push(newMember);
            members.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));

            await kv.set(MEMBERS_KEY, members);

            return res.json({
                success: true,
                member: newMember,
                message: 'Member added successfully'
            });
        }

        // PUT - Update member
        if (req.method === 'PUT') {
            if (!isAuthorized(req)) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { id, ...updates } = req.body;

            if (!id) {
                return res.status(400).json({ error: 'Member ID is required' });
            }

            const members = await kv.get(MEMBERS_KEY) || [];
            const memberIndex = members.findIndex(m => m.id === id);

            if (memberIndex === -1) {
                return res.status(404).json({ error: 'Member not found' });
            }

            members[memberIndex] = {
                ...members[memberIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };

            members.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));

            await kv.set(MEMBERS_KEY, members);

            return res.json({
                success: true,
                member: members[memberIndex],
                message: 'Member updated successfully'
            });
        }

        // DELETE - Remove member
        if (req.method === 'DELETE') {
            if (!isAuthorized(req)) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { id } = req.query;

            if (!id) {
                return res.status(400).json({ error: 'Member ID is required' });
            }

            let members = await kv.get(MEMBERS_KEY) || [];
            const initialLength = members.length;
            members = members.filter(m => m.id !== id);

            if (members.length === initialLength) {
                return res.status(404).json({ error: 'Member not found' });
            }

            await kv.set(MEMBERS_KEY, members);

            return res.json({
                success: true,
                message: 'Member removed successfully'
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Members API error:', error);
        return res.status(500).json({ error: error.message });
    }
};

function countByClass(members) {
    const counts = {};
    members.forEach(m => {
        counts[m.class] = (counts[m.class] || 0) + 1;
    });
    return counts;
}

function countByRank(members) {
    const rankNames = {
        0: 'Guild Master',
        1: 'Officer',
        2: 'Veteran',
        3: 'Raider',
        4: 'Member',
        5: 'Initiate'
    };
    const counts = {};
    members.forEach(m => {
        const rankName = rankNames[m.rank] || `Rank ${m.rank}`;
        counts[rankName] = (counts[rankName] || 0) + 1;
    });
    return counts;
}
