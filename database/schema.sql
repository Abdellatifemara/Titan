-- =====================================================
-- TITAN GUILD DATABASE SCHEMA
-- Supabase PostgreSQL
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- RAIDS TABLE
-- Stores all raid events (upcoming and completed)
-- =====================================================
CREATE TABLE raids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basic Info
    raid_type VARCHAR(50) NOT NULL, -- 'ICC 25 LoD', 'ICC 25 8/12', 'RS 25 HC', etc.
    raid_name VARCHAR(100), -- Custom name if any
    difficulty VARCHAR(20) DEFAULT 'Heroic', -- 'Normal', 'Heroic'
    size INTEGER DEFAULT 25, -- 10 or 25

    -- Schedule
    raid_date DATE NOT NULL,
    raid_time TIME NOT NULL,
    timezone VARCHAR(20) DEFAULT 'ST', -- Server Time

    -- Status
    status VARCHAR(20) DEFAULT 'upcoming', -- 'upcoming', 'completed', 'cancelled'

    -- Discord Integration
    discord_signup_link TEXT, -- Link to Discord channel for signups
    discord_event_id VARCHAR(100), -- Raid Helper event ID if any

    -- Roster (stored as JSON for flexibility)
    roster JSONB DEFAULT '[]'::jsonb,
    -- Format: [{"name": "Chibz", "class": "deathknight", "spec": "Blood", "role": "tank", "status": "confirmed"}]

    -- UwU Logs
    uwu_log_url TEXT, -- Link to uwu-logs.xyz report
    uwu_log_id VARCHAR(100), -- Parsed log identifier

    -- Stats (populated after completion)
    stats JSONB DEFAULT '{}'::jsonb,
    -- Format: {"duration": "2h 15m", "bosses_killed": 12, "wipes": 0, "deaths": 5}

    -- Notes
    notes TEXT,
    led_by VARCHAR(50) DEFAULT 'Waawaa',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_raids_date ON raids(raid_date DESC);
CREATE INDEX idx_raids_status ON raids(status);

-- =====================================================
-- PERFORMANCE TABLE
-- Stores parsed performance data from UwU logs
-- =====================================================
CREATE TABLE performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raid_id UUID REFERENCES raids(id) ON DELETE CASCADE,

    -- Player Info
    player_name VARCHAR(50) NOT NULL,
    player_class VARCHAR(20) NOT NULL,
    player_spec VARCHAR(30),

    -- Fight Info
    boss_name VARCHAR(50) NOT NULL,
    fight_duration INTEGER, -- seconds

    -- Performance Metrics
    dps DECIMAL(10, 2),
    hps DECIMAL(10, 2),
    damage_done BIGINT,
    healing_done BIGINT,
    damage_taken BIGINT,
    deaths INTEGER DEFAULT 0,

    -- Ranking (within this raid)
    dps_rank INTEGER,
    hps_rank INTEGER,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance queries
CREATE INDEX idx_performance_raid ON performance(raid_id);
CREATE INDEX idx_performance_player ON performance(player_name);
CREATE INDEX idx_performance_boss ON performance(boss_name);
CREATE INDEX idx_performance_dps ON performance(dps DESC);

-- =====================================================
-- GUILD MEMBERS TABLE
-- Stores guild member info (synced from Warmane API)
-- =====================================================
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Character Info
    name VARCHAR(50) NOT NULL UNIQUE,
    class VARCHAR(20) NOT NULL,
    race VARCHAR(20),
    level INTEGER DEFAULT 80,

    -- Warmane Data
    achievement_points INTEGER DEFAULT 0,
    pve_rank INTEGER,
    pvp_rank INTEGER,

    -- Guild Info
    guild_rank VARCHAR(30), -- 'Guild Master', 'Officer', 'Raider', 'Member', 'Trial'
    rank_order INTEGER DEFAULT 5,

    -- Links
    armory_url TEXT,
    uwu_profile_url TEXT,

    -- Activity
    is_active BOOLEAN DEFAULT true,
    last_seen DATE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for member queries
CREATE INDEX idx_members_class ON members(class);
CREATE INDEX idx_members_rank ON members(rank_order);

-- =====================================================
-- ADDONS TABLE
-- Curated addon recommendations
-- =====================================================
CREATE TABLE addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Addon Info
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(30) NOT NULL, -- 'Essential', 'Recommended', 'Class-Specific', 'UI', 'Quality of Life'

    -- Links
    download_url TEXT NOT NULL,
    github_url TEXT,

    -- Metadata
    is_required BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 100,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- BIS ITEMS TABLE
-- Best in Slot items per class/spec
-- =====================================================
CREATE TABLE bis_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Class/Spec
    class VARCHAR(20) NOT NULL,
    spec VARCHAR(30) NOT NULL,

    -- Item Info
    slot VARCHAR(30) NOT NULL, -- 'Head', 'Neck', 'Shoulder', etc.
    item_name VARCHAR(100) NOT NULL,
    item_id INTEGER, -- Wowhead item ID

    -- Source
    source_boss VARCHAR(50),
    source_raid VARCHAR(50), -- 'ICC 25 HC', 'RS 25 HC', etc.
    drop_rate VARCHAR(20),

    -- Priority (for loot rules)
    priority_classes TEXT[], -- Classes that have priority
    priority_note TEXT,

    -- Wowhead link
    wowhead_url TEXT,

    -- Display
    display_order INTEGER DEFAULT 100,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for BiS queries
CREATE INDEX idx_bis_class_spec ON bis_items(class, spec);
CREATE INDEX idx_bis_slot ON bis_items(slot);

-- =====================================================
-- LOOT RULES TABLE
-- Item-specific loot priority rules
-- =====================================================
CREATE TABLE loot_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Boss/Item
    boss_name VARCHAR(50) NOT NULL,
    raid VARCHAR(50) NOT NULL, -- 'ICC 25', 'RS 25'
    item_name VARCHAR(100) NOT NULL,

    -- Priority
    priority_specs TEXT[] NOT NULL, -- ['Combat Rogue', 'FDK', 'Feral Cat']
    priority_note TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for loot rules
CREATE INDEX idx_loot_boss ON loot_rules(boss_name);

-- =====================================================
-- ADMIN SETTINGS TABLE
-- Simple key-value settings
-- =====================================================
CREATE TABLE settings (
    key VARCHAR(50) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (key, value) VALUES
    ('discord_invite', '"https://discord.gg/titan"'),
    ('guild_name', '"T I T A N"'),
    ('server', '"Icecrown"'),
    ('admin_password_hash', '""'), -- Set via Supabase Auth instead
    ('warmane_guild_url', '"https://armory.warmane.com/api/guild/T+I+T+A+N/Icecrown/members"');

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE raids ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE bis_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE loot_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Public read access for most tables
CREATE POLICY "Public read access" ON raids FOR SELECT USING (true);
CREATE POLICY "Public read access" ON performance FOR SELECT USING (true);
CREATE POLICY "Public read access" ON members FOR SELECT USING (true);
CREATE POLICY "Public read access" ON addons FOR SELECT USING (true);
CREATE POLICY "Public read access" ON bis_items FOR SELECT USING (true);
CREATE POLICY "Public read access" ON loot_rules FOR SELECT USING (true);
CREATE POLICY "Public read access" ON settings FOR SELECT USING (true);

-- Admin write access (requires authentication)
-- These policies allow authenticated users to modify data
CREATE POLICY "Admin write access" ON raids FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write access" ON performance FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write access" ON members FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write access" ON addons FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write access" ON bis_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write access" ON loot_rules FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write access" ON settings FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_raids_updated_at
    BEFORE UPDATE ON raids
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Sample raid types for dropdown
-- INSERT INTO settings (key, value) VALUES
--     ('raid_types', '["ICC 25 LoD", "ICC 25 8/12", "ICC 10 HC", "RS 25 HC", "RS 10 HC", "ToGC 25", "VoA 25"]');
