const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        // Test write
        const testKey = 'titan:test';
        const testValue = { timestamp: Date.now(), message: 'KV is working!' };

        await kv.set(testKey, testValue);

        // Test read
        const readBack = await kv.get(testKey);

        // Check all titan keys
        const raids = await kv.get('titan:raids');
        const members = await kv.get('titan:members');
        const topParsers = await kv.get('titan:top-parsers');

        return res.json({
            success: true,
            kvConnected: true,
            testWrite: testValue,
            testRead: readBack,
            existingData: {
                raids: raids ? raids.length : 0,
                members: members ? members.length : 0,
                topParsersExists: !!topParsers
            },
            envCheck: {
                hasKvUrl: !!process.env.KV_REST_API_URL,
                hasKvToken: !!process.env.KV_REST_API_TOKEN,
                hasAdminPassword: !!process.env.ADMIN_PASSWORD
            }
        });
    } catch (error) {
        return res.json({
            success: false,
            kvConnected: false,
            error: error.message,
            envCheck: {
                hasKvUrl: !!process.env.KV_REST_API_URL,
                hasKvToken: !!process.env.KV_REST_API_TOKEN,
                hasAdminPassword: !!process.env.ADMIN_PASSWORD
            }
        });
    }
};
