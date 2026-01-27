/**
 * Migration Script: Move existing JSON data to Vercel KV
 *
 * Prerequisites:
 * 1. Create .env.local with your KV credentials:
 *    KV_REST_API_URL=your_url
 *    KV_REST_API_TOKEN=your_token
 *
 * 2. Install dependencies:
 *    npm install @vercel/kv dotenv
 *
 * 3. Run this script:
 *    node scripts/migrate-to-kv.js
 */

require('dotenv').config({ path: '.env.local' });
const { kv } = require('@vercel/kv');
const fs = require('fs');
const path = require('path');

// KV Keys
const RAIDS_KEY = 'titan:raids';
const TOP_PARSERS_KEY = 'titan:top-parsers';
const PROCESSED_LOGS_KEY = 'titan:logs-processed';

async function migrateRaidLogs() {
    console.log('\n--- Migrating Raid Logs ---');

    try {
        const dataPath = path.join(__dirname, '..', 'raid-logs.json');

        if (!fs.existsSync(dataPath)) {
            console.log('raid-logs.json not found, skipping...');
            return;
        }

        const rawData = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(rawData);

        // Convert log entries to raid objects
        const raids = (data.logs || []).map((log, index) => ({
            id: `migrated-${index}-${Date.now()}`,
            date: log.date,
            raidName: log.raid === 'Icecrown' ? 'ICC 25 HC' : log.raid === 'Ruby Sanctum' ? 'RS 25 HC' : log.raid,
            bossKills: 12,
            composition: { tanks: [], melee: [], ranged: [], healers: [] },
            compositionText: '',
            uwuLogUrl: log.url,
            notes: log.note || `Logged by ${log.logger}`,
            status: 'completed',
            logger: log.logger,
            postedBy: log.postedBy || log.logger,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }));

        // Store in KV
        await kv.set(RAIDS_KEY, raids);

        // Also store processed log IDs
        const processedLogIds = (data.logs || []).map(log => {
            const match = log.url.match(/\/reports\/([^\/]+)/);
            return match ? match[1] : null;
        }).filter(Boolean);

        await kv.set(PROCESSED_LOGS_KEY, processedLogIds);

        console.log(`Migrated ${raids.length} raids to KV`);
        console.log(`Stored ${processedLogIds.length} processed log IDs`);

    } catch (error) {
        console.error('Error migrating raid logs:', error.message);
    }
}

async function migrateTopParsers() {
    console.log('\n--- Migrating Top Parsers ---');

    try {
        const dataPath = path.join(__dirname, '..', 'data', 'top-parsers.json');

        if (!fs.existsSync(dataPath)) {
            console.log('top-parsers.json not found, skipping...');
            return;
        }

        const rawData = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(rawData);

        // Transform the data structure if needed
        // The existing format has bestOverall, bestByClass, topPerformances
        // We need to transform it to a simpler array format per boss

        const transformedData = {
            dps: {},
            hps: {},
            totalLogs: data.totalLogs || 0,
            dateRange: data.dateRange || { from: null, to: null },
            generated: new Date().toISOString()
        };

        // Transform DPS data
        if (data.dps) {
            for (const [bossName, bossData] of Object.entries(data.dps)) {
                // Use topPerformances if available, otherwise create from bestByClass
                if (bossData.topPerformances && Array.isArray(bossData.topPerformances)) {
                    transformedData.dps[bossName] = bossData.topPerformances.slice(0, 10);
                } else if (bossData.bestByClass) {
                    transformedData.dps[bossName] = Object.values(bossData.bestByClass)
                        .filter(p => p && p.player)
                        .sort((a, b) => (b.dps || 0) - (a.dps || 0))
                        .slice(0, 10);
                } else {
                    transformedData.dps[bossName] = [];
                }
            }
        }

        // Transform HPS data
        if (data.hps) {
            for (const [bossName, bossData] of Object.entries(data.hps)) {
                if (bossData.topPerformances && Array.isArray(bossData.topPerformances)) {
                    transformedData.hps[bossName] = bossData.topPerformances.slice(0, 10);
                } else if (bossData.bestByClass) {
                    transformedData.hps[bossName] = Object.values(bossData.bestByClass)
                        .filter(p => p && p.player)
                        .sort((a, b) => (b.hps || 0) - (a.hps || 0))
                        .slice(0, 10);
                } else {
                    transformedData.hps[bossName] = [];
                }
            }
        }

        // Store in KV
        await kv.set(TOP_PARSERS_KEY, transformedData);

        const dpsCount = Object.keys(transformedData.dps).length;
        const hpsCount = Object.keys(transformedData.hps).length;

        console.log(`Migrated top parsers: ${dpsCount} bosses (DPS), ${hpsCount} bosses (HPS)`);

    } catch (error) {
        console.error('Error migrating top parsers:', error.message);
    }
}

async function verifyMigration() {
    console.log('\n--- Verifying Migration ---');

    try {
        const raids = await kv.get(RAIDS_KEY);
        const topParsers = await kv.get(TOP_PARSERS_KEY);
        const processedLogs = await kv.get(PROCESSED_LOGS_KEY);

        console.log(`Raids in KV: ${raids?.length || 0}`);
        console.log(`DPS bosses in KV: ${Object.keys(topParsers?.dps || {}).length}`);
        console.log(`HPS bosses in KV: ${Object.keys(topParsers?.hps || {}).length}`);
        console.log(`Processed logs in KV: ${processedLogs?.length || 0}`);

        if (raids?.length > 0) {
            console.log('\nFirst raid:', raids[0]);
        }

    } catch (error) {
        console.error('Verification error:', error.message);
    }
}

async function main() {
    console.log('===========================================');
    console.log('TITAN Guild - KV Migration Script');
    console.log('===========================================');

    // Check environment variables
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
        console.error('\nError: KV environment variables not set!');
        console.error('Make sure .env.local contains:');
        console.error('  KV_REST_API_URL=your_url');
        console.error('  KV_REST_API_TOKEN=your_token');
        process.exit(1);
    }

    console.log('\nKV_REST_API_URL configured: Yes');

    await migrateRaidLogs();
    await migrateTopParsers();
    await verifyMigration();

    console.log('\n===========================================');
    console.log('Migration Complete!');
    console.log('===========================================');
}

main().catch(console.error);
