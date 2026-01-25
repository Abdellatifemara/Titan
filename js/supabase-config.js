// =====================================================
// SUPABASE CONFIGURATION
// Replace these values with your actual Supabase project credentials
// =====================================================

const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // e.g., 'https://xxxxx.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Public anon key (safe for client-side)

// Initialize Supabase client
// Include this script after loading Supabase JS library:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

let supabase;

function initSupabase() {
    if (typeof window !== 'undefined' && window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase initialized');
        return supabase;
    } else {
        console.error('Supabase JS library not loaded');
        return null;
    }
}

// =====================================================
// DATABASE HELPERS
// =====================================================

const db = {
    // -------------------------------------------------
    // RAIDS
    // -------------------------------------------------
    raids: {
        // Get all raids
        async getAll() {
            const { data, error } = await supabase
                .from('raids')
                .select('*')
                .order('raid_date', { ascending: false });
            if (error) throw error;
            return data;
        },

        // Get upcoming raids
        async getUpcoming() {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('raids')
                .select('*')
                .eq('status', 'upcoming')
                .gte('raid_date', today)
                .order('raid_date', { ascending: true });
            if (error) throw error;
            return data;
        },

        // Get completed raids (history)
        async getCompleted(limit = 50) {
            const { data, error } = await supabase
                .from('raids')
                .select('*')
                .eq('status', 'completed')
                .order('raid_date', { ascending: false })
                .limit(limit);
            if (error) throw error;
            return data;
        },

        // Get raids for a specific month (for calendar)
        async getByMonth(year, month) {
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
            const { data, error } = await supabase
                .from('raids')
                .select('*')
                .gte('raid_date', startDate)
                .lte('raid_date', endDate)
                .order('raid_date', { ascending: true });
            if (error) throw error;
            return data;
        },

        // Get single raid by ID
        async getById(id) {
            const { data, error } = await supabase
                .from('raids')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return data;
        },

        // Create new raid
        async create(raidData) {
            const { data, error } = await supabase
                .from('raids')
                .insert([raidData])
                .select()
                .single();
            if (error) throw error;
            return data;
        },

        // Update raid
        async update(id, updates) {
            const { data, error } = await supabase
                .from('raids')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },

        // Delete raid
        async delete(id) {
            const { error } = await supabase
                .from('raids')
                .delete()
                .eq('id', id);
            if (error) throw error;
            return true;
        }
    },

    // -------------------------------------------------
    // PERFORMANCE
    // -------------------------------------------------
    performance: {
        // Get all performance data for a raid
        async getByRaid(raidId) {
            const { data, error } = await supabase
                .from('performance')
                .select('*')
                .eq('raid_id', raidId)
                .order('dps', { ascending: false });
            if (error) throw error;
            return data;
        },

        // Get player performance history
        async getByPlayer(playerName, limit = 100) {
            const { data, error } = await supabase
                .from('performance')
                .select('*, raids(raid_date, raid_type)')
                .eq('player_name', playerName)
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error) throw error;
            return data;
        },

        // Get top DPS leaderboard
        async getTopDPS(bossName = null, limit = 20) {
            let query = supabase
                .from('performance')
                .select('player_name, player_class, dps, boss_name, raid_id')
                .order('dps', { ascending: false })
                .limit(limit);

            if (bossName) {
                query = query.eq('boss_name', bossName);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        },

        // Get player averages
        async getPlayerAverages(playerName) {
            const { data, error } = await supabase
                .rpc('get_player_averages', { p_name: playerName });
            if (error) throw error;
            return data;
        },

        // Bulk insert performance data (from log parsing)
        async bulkInsert(performanceData) {
            const { data, error } = await supabase
                .from('performance')
                .insert(performanceData);
            if (error) throw error;
            return data;
        }
    },

    // -------------------------------------------------
    // MEMBERS
    // -------------------------------------------------
    members: {
        // Get all members
        async getAll() {
            const { data, error } = await supabase
                .from('members')
                .select('*')
                .eq('is_active', true)
                .order('rank_order', { ascending: true })
                .order('name', { ascending: true });
            if (error) throw error;
            return data;
        },

        // Get member by name
        async getByName(name) {
            const { data, error } = await supabase
                .from('members')
                .select('*')
                .eq('name', name)
                .single();
            if (error) throw error;
            return data;
        },

        // Sync members from Warmane API (admin only)
        async syncFromWarmane(membersData) {
            // Upsert all members
            const { data, error } = await supabase
                .from('members')
                .upsert(membersData, { onConflict: 'name' });
            if (error) throw error;
            return data;
        }
    },

    // -------------------------------------------------
    // ADDONS
    // -------------------------------------------------
    addons: {
        // Get all addons grouped by category
        async getAll() {
            const { data, error } = await supabase
                .from('addons')
                .select('*')
                .order('display_order', { ascending: true });
            if (error) throw error;
            return data;
        },

        // Get required addons
        async getRequired() {
            const { data, error } = await supabase
                .from('addons')
                .select('*')
                .eq('is_required', true)
                .order('display_order', { ascending: true });
            if (error) throw error;
            return data;
        }
    },

    // -------------------------------------------------
    // BIS ITEMS
    // -------------------------------------------------
    bis: {
        // Get BiS for class/spec
        async getByClassSpec(playerClass, spec) {
            const { data, error } = await supabase
                .from('bis_items')
                .select('*')
                .eq('class', playerClass)
                .eq('spec', spec)
                .order('display_order', { ascending: true });
            if (error) throw error;
            return data;
        },

        // Get all loot rules
        async getLootRules(raid = null) {
            let query = supabase
                .from('loot_rules')
                .select('*')
                .order('boss_name', { ascending: true });

            if (raid) {
                query = query.eq('raid', raid);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        }
    },

    // -------------------------------------------------
    // SETTINGS
    // -------------------------------------------------
    settings: {
        // Get a setting
        async get(key) {
            const { data, error } = await supabase
                .from('settings')
                .select('value')
                .eq('key', key)
                .single();
            if (error) throw error;
            return data?.value;
        },

        // Set a setting (admin only)
        async set(key, value) {
            const { data, error } = await supabase
                .from('settings')
                .upsert({ key, value, updated_at: new Date().toISOString() });
            if (error) throw error;
            return data;
        }
    }
};

// =====================================================
// AUTHENTICATION HELPERS
// =====================================================

const auth = {
    // Sign in with password (for admin)
    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    },

    // Sign out
    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    // Get current session
    async getSession() {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        return data.session;
    },

    // Check if user is admin (authenticated)
    async isAdmin() {
        const session = await this.getSession();
        return !!session;
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initSupabase, db, auth, SUPABASE_URL, SUPABASE_ANON_KEY };
}
