const { kv } = require('@vercel/kv');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'titan2026';
const GUIDES_KEY = 'titan:guides';
const ADDONS_KEY = 'titan:addons';
const WEAKAURAS_KEY = 'titan:weakauras';

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
        const { type } = req.query; // guides, addons, or weakauras

        // Determine which key to use
        let KEY;
        switch (type) {
            case 'addons':
                KEY = ADDONS_KEY;
                break;
            case 'weakauras':
                KEY = WEAKAURAS_KEY;
                break;
            default:
                KEY = GUIDES_KEY;
        }

        // GET - Fetch all items
        if (req.method === 'GET') {
            // If no type specified, return all
            if (!type) {
                const guides = await kv.get(GUIDES_KEY) || [];
                const addons = await kv.get(ADDONS_KEY) || [];
                const weakauras = await kv.get(WEAKAURAS_KEY) || [];

                return res.json({
                    guides,
                    addons,
                    weakauras
                });
            }

            const items = await kv.get(KEY) || [];
            return res.json({ items, total: items.length });
        }

        // POST - Add new item
        if (req.method === 'POST') {
            if (!isAuthorized(req)) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { name, description, url, category, priority, content } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'Name is required' });
            }

            const items = await kv.get(KEY) || [];

            const newItem = {
                id: generateId(),
                name,
                description: description || '',
                url: url || '',
                category: category || 'General',
                priority: priority || 0,
                content: content || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            items.push(newItem);
            items.sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name));

            await kv.set(KEY, items);

            return res.json({
                success: true,
                item: newItem,
                message: `${type || 'Guide'} added successfully`
            });
        }

        // PUT - Update item
        if (req.method === 'PUT') {
            if (!isAuthorized(req)) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { id, ...updates } = req.body;

            if (!id) {
                return res.status(400).json({ error: 'Item ID is required' });
            }

            const items = await kv.get(KEY) || [];
            const itemIndex = items.findIndex(item => item.id === id);

            if (itemIndex === -1) {
                return res.status(404).json({ error: 'Item not found' });
            }

            items[itemIndex] = {
                ...items[itemIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };

            items.sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name));

            await kv.set(KEY, items);

            return res.json({
                success: true,
                item: items[itemIndex],
                message: 'Item updated successfully'
            });
        }

        // DELETE - Remove item
        if (req.method === 'DELETE') {
            if (!isAuthorized(req)) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { id } = req.query;

            if (!id) {
                return res.status(400).json({ error: 'Item ID is required' });
            }

            let items = await kv.get(KEY) || [];
            const initialLength = items.length;
            items = items.filter(item => item.id !== id);

            if (items.length === initialLength) {
                return res.status(404).json({ error: 'Item not found' });
            }

            await kv.set(KEY, items);

            return res.json({
                success: true,
                message: 'Item removed successfully'
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Guides API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
