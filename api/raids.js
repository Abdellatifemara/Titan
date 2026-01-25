const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const dataPath = path.join(process.cwd(), 'data', 'raid-logs.json');
        const data = fs.readFileSync(dataPath, 'utf8');
        return res.json(JSON.parse(data));
    } catch (error) {
        return res.json({ raids: [] });
    }
};
