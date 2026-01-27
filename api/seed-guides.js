const { kv } = require('@vercel/kv');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'titan2026';
const ADDONS_KEY = 'titan:addons';
const WEAKAURAS_KEY = 'titan:weakauras';

module.exports = async (req, res) => {
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
        // Seed Addons
        const addons = [
            { id: 'addon-1', name: 'DBM-Warmane', description: 'Boss timers & alerts optimized for Warmane. By Zidras.', url: 'https://github.com/Zidras/DBM-Warmane', category: 'Required', priority: 100 },
            { id: 'addon-2', name: 'WeakAuras WotLK', description: 'Custom alerts, buff tracking, cooldowns. Backported by Bunny67.', url: 'https://github.com/Bunny67/WeakAuras-WotLK', category: 'Required', priority: 99 },
            { id: 'addon-3', name: 'Details! Damage Meter', description: 'Advanced combat analysis - DPS, healing, deaths, interrupts.', url: 'https://github.com/Tersjansen/Details-WotLK-3.3.5a', category: 'Recommended', priority: 80 },
            { id: 'addon-4', name: 'Omen Threat Meter', description: 'Real-time threat tracking for tanks and DPS.', url: 'https://github.com/NoM0Re/WoW-3.3.5a-Addons/tree/main/Omen', category: 'Recommended', priority: 79 },
            { id: 'addon-5', name: 'GTFO', description: 'Loud alert when standing in fire/void zones.', url: 'https://github.com/NoM0Re/WoW-3.3.5a-Addons/tree/main/GTFO', category: 'Recommended', priority: 78 },
            { id: 'addon-6', name: 'Decursive', description: 'One-click dispelling for healers.', url: 'https://github.com/NoM0Re/WoW-3.3.5a-Addons/tree/main/Decursive', category: 'Recommended', priority: 77 },
            { id: 'addon-7', name: 'AtlasLoot Enhanced', description: 'In-game loot browser for all dungeons/raids.', url: 'https://github.com/NoM0Re/WoW-3.3.5a-Addons/tree/main/AtlasLoot', category: 'Recommended', priority: 76 },
            { id: 'addon-8', name: 'Quartz', description: 'Casting bar replacement with latency display.', url: 'https://github.com/NoM0Re/WoW-3.3.5a-Addons/tree/main/Quartz', category: 'Recommended', priority: 75 },
            { id: 'addon-9', name: 'Complete 3.3.5 Addon Collection', description: 'NoM0Re GitHub - 500+ working addons for WotLK.', url: 'https://github.com/NoM0Re/WoW-3.3.5a-Addons', category: 'Collection', priority: 50 },
            { id: 'addon-10', name: 'ElvUI WotLK', description: 'Complete UI replacement with built-in raid frames.', url: 'https://github.com/ElvUI-WotLK/ElvUI', category: 'Collection', priority: 49 },
        ];

        // Seed WeakAuras
        const weakauras = [
            // DPS
            { id: 'wa-1', name: 'Fury Warrior', description: 'Rotation helper', url: 'https://wago.io/B8vu1dbWs', category: 'DPS', priority: 100 },
            { id: 'wa-2', name: 'Combat Rogue', description: 'Rotation helper', url: 'https://wago.io/Y_5G9r2BW', category: 'DPS', priority: 99 },
            { id: 'wa-3', name: 'Assassination Rogue', description: 'Rotation helper', url: 'https://wago.io/8s4Gq4SFh', category: 'DPS', priority: 98 },
            { id: 'wa-4', name: 'Retribution Paladin', description: 'Rotation helper', url: 'https://wago.io/KTLaxIexq', category: 'DPS', priority: 97 },
            { id: 'wa-5', name: 'Feral Druid', description: 'Rotation helper', url: 'https://wago.io/ooV04rqhr', category: 'DPS', priority: 96 },
            { id: 'wa-6', name: 'Balance Druid', description: 'Rotation helper', url: 'https://wago.io/zk8HoTVUO', category: 'DPS', priority: 95 },
            { id: 'wa-7', name: 'Frost DK', description: 'Rotation helper', url: 'https://wago.io/vZ6gs9AbY', category: 'DPS', priority: 94 },
            { id: 'wa-8', name: 'Unholy DK', description: 'Rotation helper', url: 'https://wago.io/TLuemnuHk', category: 'DPS', priority: 93 },
            { id: 'wa-9', name: 'MM Hunter', description: 'Rotation helper', url: 'https://wago.io/ZMUpgFthJ', category: 'DPS', priority: 92 },
            { id: 'wa-10', name: 'Survival Hunter', description: 'Rotation helper', url: 'https://wago.io/v3rbkAFQT', category: 'DPS', priority: 91 },
            { id: 'wa-11', name: 'Fire Mage', description: 'Rotation helper', url: 'https://wago.io/XoTCW-6Xu', category: 'DPS', priority: 90 },
            { id: 'wa-12', name: 'Arcane Mage', description: 'Rotation helper', url: 'https://wago.io/ztT6Y9iiR', category: 'DPS', priority: 89 },
            { id: 'wa-13', name: 'Shadow Priest', description: 'Rotation helper', url: 'https://wago.io/FpGvSvCHs', category: 'DPS', priority: 88 },
            { id: 'wa-14', name: 'Elemental Shaman', description: 'Rotation helper', url: 'https://wago.io/hHlPFqUkN', category: 'DPS', priority: 87 },
            { id: 'wa-15', name: 'Enhancement Shaman', description: 'Rotation helper', url: 'https://wago.io/ICX5AgEe-', category: 'DPS', priority: 86 },
            { id: 'wa-16', name: 'Affliction Warlock', description: 'Rotation helper', url: 'https://wago.io/33IiwDQBa', category: 'DPS', priority: 85 },
            { id: 'wa-17', name: 'Demonology Warlock', description: 'Rotation helper', url: 'https://wago.io/qmCwAwwq4', category: 'DPS', priority: 84 },
            // Healers
            { id: 'wa-18', name: 'Holy Paladin', description: 'Healer helper', url: 'https://wago.io/oseX5OcMM', category: 'Healer', priority: 80 },
            { id: 'wa-19', name: 'Restoration Shaman', description: 'Healer helper', url: 'https://wago.io/RE167IifA', category: 'Healer', priority: 79 },
            { id: 'wa-20', name: 'Restoration Druid', description: 'Healer helper', url: 'https://wago.io/t3-D2Mz-b', category: 'Healer', priority: 78 },
            { id: 'wa-21', name: 'Holy Priest', description: 'Healer helper', url: 'https://wago.io/eBFEumA9g', category: 'Healer', priority: 77 },
            { id: 'wa-22', name: 'Discipline Priest', description: 'Healer helper', url: 'https://wago.io/sDOpoBE2x', category: 'Healer', priority: 76 },
            // Tanks
            { id: 'wa-23', name: 'Blood DK', description: 'Tank helper', url: 'https://wago.io/K4uULEVMm', category: 'Tank', priority: 70 },
            { id: 'wa-24', name: 'Protection Paladin', description: 'Tank helper', url: 'https://wago.io/yutPnI6XZ', category: 'Tank', priority: 69 },
            { id: 'wa-25', name: 'Protection Warrior', description: 'Tank helper', url: 'https://wago.io/s6dh6x9lg', category: 'Tank', priority: 68 },
            { id: 'wa-26', name: 'Feral Bear', description: 'Tank helper', url: 'https://wago.io/HfLKWSqVs', category: 'Tank', priority: 67 },
            // ICC Boss
            { id: 'wa-27', name: 'Lord Marrowgar', description: 'Boss mechanics', url: 'https://wago.io/dQbfvrPZB', category: 'ICC Boss', priority: 60 },
            { id: 'wa-28', name: 'Lady Deathwhisper', description: 'Boss mechanics', url: 'https://wago.io/hCmpAg_4c', category: 'ICC Boss', priority: 59 },
            { id: 'wa-29', name: 'Professor Putricide', description: 'Boss mechanics', url: 'https://wago.io/i_gNzIyXV', category: 'ICC Boss', priority: 58 },
            { id: 'wa-30', name: 'Blood Prince Council', description: 'Boss mechanics', url: 'https://wago.io/HfeFMeWZp', category: 'ICC Boss', priority: 57 },
            { id: 'wa-31', name: 'Sindragosa', description: 'Boss mechanics', url: 'https://wago.io/FHcSSJrPq', category: 'ICC Boss', priority: 56 },
            { id: 'wa-32', name: 'Lich King', description: 'Boss mechanics', url: 'https://wago.io/Qu55hX34Y', category: 'ICC Boss', priority: 55 },
            { id: 'wa-33', name: 'ICC Core Library', description: 'Required dependency', url: 'https://wago.io/4Ed4K2AbB', category: 'ICC Boss', priority: 54 },
            { id: 'wa-34', name: 'ICC Assistance Pack', description: 'All bosses pack', url: 'https://wago.io/q9-VKiMvh', category: 'ICC Boss', priority: 53 },
            { id: 'wa-35', name: 'Infest Counter', description: 'LK Infest tracker', url: 'https://wago.io/ZEswMWPxg', category: 'ICC Boss', priority: 52 },
            // Utility
            { id: 'wa-36', name: 'Combat Text', description: 'Floating combat numbers', url: 'https://wago.io/dKkmIbovp', category: 'Utility', priority: 40 },
            { id: 'wa-37', name: 'Item ICDs & Procs', description: 'Trinket proc tracking', url: 'https://wago.io/V1ibZh8G9', category: 'Utility', priority: 39 },
            { id: 'wa-38', name: 'Damage Reduction Suite', description: 'Defensive CD tracking', url: 'https://wago.io/vVdzG1c3y', category: 'Utility', priority: 38 },
            { id: 'wa-39', name: 'Power Infusion Assistant', description: 'PI tracking', url: 'https://wago.io/86orn5eUe', category: 'Utility', priority: 37 },
            { id: 'wa-40', name: 'Raid Buffs Reminder', description: 'Missing buff alerts', url: 'https://wago.io/21mE5Z33B', category: 'Utility', priority: 36 },
            { id: 'wa-41', name: 'Boss Swing Timer', description: 'Melee swing tracking', url: 'https://wago.io/oHVnqP5rj', category: 'Utility', priority: 35 },
            { id: 'wa-42', name: 'Simple Stats', description: 'Character stats display', url: 'https://wago.io/IgOXJw9DS', category: 'Utility', priority: 34 },
            // Raid Leader
            { id: 'wa-43', name: 'Raid Cooldowns (Dep)', description: 'CD tracking dependency', url: 'https://wago.io/hInmmxY9k', category: 'Raid Leader', priority: 30 },
            { id: 'wa-44', name: 'Raid Cooldowns (Main)', description: 'Raid CD tracker', url: 'https://wago.io/TPMuElKHh', category: 'Raid Leader', priority: 29 },
            { id: 'wa-45', name: 'Raid Target Markers', description: 'Quick marking buttons', url: 'https://wago.io/MVNfKD7TF', category: 'Raid Leader', priority: 28 },
            { id: 'wa-46', name: 'Master Loot WA', description: 'Loot distribution helper', url: 'https://wago.io/DqzZxB0io', category: 'Raid Leader', priority: 27 },
            { id: 'wa-47', name: 'Healer Mana Assistant', description: 'Raid healer mana bars', url: 'https://wago.io/PJhr9f7bo', category: 'Raid Leader', priority: 26 },
        ];

        // Add timestamps
        const now = new Date().toISOString();
        addons.forEach(a => { a.createdAt = now; a.updatedAt = now; a.content = ''; });
        weakauras.forEach(w => { w.createdAt = now; w.updatedAt = now; w.content = ''; });

        await kv.set(ADDONS_KEY, addons);
        await kv.set(WEAKAURAS_KEY, weakauras);

        return res.json({
            success: true,
            message: 'Guides data seeded successfully',
            addons: addons.length,
            weakauras: weakauras.length
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
