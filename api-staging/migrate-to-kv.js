// MIGRATION SCRIPT: Push local JSON data to Vercel KV
// Run this ONCE after setting up Vercel KV
// Usage: node api-staging/migrate-to-kv.js

const { kv } = require('@vercel/kv');
const fs = require('fs');
const path = require('path');

async function migrate() {
    console.log('Starting migration to Vercel KV...\n');

    // Migrate top-parsers.json
    try {
        const topParsersPath = path.join(__dirname, '..', 'data', 'top-parsers.json');
        const topParsersData = JSON.parse(fs.readFileSync(topParsersPath, 'utf8'));

        await kv.set('titan:top-parsers', topParsersData);
        console.log('✓ Migrated top-parsers.json');
        console.log(`  - ${topParsersData.totalLogs} logs`);
        console.log(`  - Date range: ${topParsersData.dateRange?.from} to ${topParsersData.dateRange?.to}`);
    } catch (error) {
        console.error('✗ Failed to migrate top-parsers:', error.message);
    }

    // Migrate raid-logs.json
    try {
        const raidLogsPath = path.join(__dirname, '..', 'data', 'raid-logs.json');
        const raidLogsData = JSON.parse(fs.readFileSync(raidLogsPath, 'utf8'));

        await kv.set('titan:raids', raidLogsData.raids || []);
        console.log('✓ Migrated raid-logs.json');
        console.log(`  - ${(raidLogsData.raids || []).length} raids`);
    } catch (error) {
        console.error('✗ Failed to migrate raid-logs:', error.message);
    }

    console.log('\nMigration complete!');
    console.log('You can now switch the api/ files to use the KV versions.');
}

// Run migration
migrate().catch(console.error);
