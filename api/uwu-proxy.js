module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, server, spec } = req.query;

    if (!name) {
        return res.status(400).json({ error: 'name parameter required' });
    }

    try {
        const url = `https://uwu-logs.xyz/character?name=${encodeURIComponent(name)}&server=${encodeURIComponent(server || 'Icecrown')}&spec=${spec || 3}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch from uwu-logs' });
        }

        const html = await response.text();

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(html);

    } catch (error) {
        console.error('UwU proxy error:', error);
        return res.status(500).json({ error: error.message });
    }
};
