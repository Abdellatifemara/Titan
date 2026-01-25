const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'titan2026';

module.exports = async (req, res) => {
    // Enable CORS
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

    try {
        const { logUrl } = req.body;

        // Extract log ID from URL
        // Format: https://uwu-logs.xyz/reports/YY-MM-DD--HH-MM--CharName--Server/
        const reportsMatch = logUrl.match(/\/reports\/([^\/]+)/);
        const logMatch = logUrl.match(/\/log\/([a-zA-Z0-9]+)/);

        let logId, apiUrl;

        if (reportsMatch) {
            logId = reportsMatch[1];
            // Try different API endpoints
            apiUrl = `https://uwu-logs.xyz/api/reports/${logId}`;
        } else if (logMatch) {
            logId = logMatch[1];
            apiUrl = `https://uwu-logs.xyz/api/log/${logId}`;
        } else {
            return res.status(400).json({ error: 'Invalid UwU logs URL format' });
        }

        // Fetch log data from UwU logs
        const response = await fetch(apiUrl);

        if (!response.ok) {
            // Try alternative endpoint
            const altUrl = `https://uwu-logs.xyz/api/v1/reports/${logId}`;
            const altResponse = await fetch(altUrl);

            if (!altResponse.ok) {
                return res.status(400).json({
                    error: 'Failed to fetch log data. The API might not be publicly available.',
                    logId: logId,
                    tip: 'You may need to manually add the data from the UwU logs website.'
                });
            }
        }

        let logData;
        try {
            logData = await response.json();
        } catch (e) {
            return res.status(400).json({
                error: 'UwU logs API returned invalid data',
                logId: logId
            });
        }

        const updates = [];
        const logDate = logData.date || new Date().toISOString().split('T')[0];

        // Process encounters if available
        if (logData.encounters) {
            for (const encounter of logData.encounters) {
                const bossName = encounter.boss;

                if (encounter.players) {
                    for (const player of encounter.players) {
                        if (player.dps > 0) {
                            updates.push({
                                boss: bossName,
                                player: player.name,
                                class: player.class,
                                dps: player.dps,
                                date: logDate,
                                logId: logId
                            });
                        }
                    }
                }
            }
        }

        // In production, you'd save to database here
        // For now, return the parsed data

        return res.json({
            success: true,
            logId,
            updates,
            message: `Parsed ${updates.length} player records`,
            note: 'To persist data, connect a database (Vercel KV, Supabase, etc.)'
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
