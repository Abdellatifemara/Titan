// =====================================================
// UWU LOGS PARSER
// Client-side JavaScript parser for WoW combat logs
// Extracts DPS, HPS, deaths, and other metrics
// =====================================================

const UwULogParser = {
    // Class name mappings
    CLASS_NAMES: {
        'WARRIOR': 'Warrior',
        'PALADIN': 'Paladin',
        'HUNTER': 'Hunter',
        'ROGUE': 'Rogue',
        'PRIEST': 'Priest',
        'DEATHKNIGHT': 'Death Knight',
        'SHAMAN': 'Shaman',
        'MAGE': 'Mage',
        'WARLOCK': 'Warlock',
        'DRUID': 'Druid'
    },

    // ICC Boss names for detection
    ICC_BOSSES: [
        'Lord Marrowgar',
        'Lady Deathwhisper',
        'Gunship Battle',
        'Deathbringer Saurfang',
        'Festergut',
        'Rotface',
        'Professor Putricide',
        'Blood Prince Council',
        'Blood-Queen Lana\'thel',
        'Valithria Dreamwalker',
        'Sindragosa',
        'The Lich King'
    ],

    // RS Boss
    RS_BOSSES: [
        'Halion'
    ],

    // All tracked bosses
    ALL_BOSSES: [],

    // Initialize
    init() {
        this.ALL_BOSSES = [...this.ICC_BOSSES, ...this.RS_BOSSES];
    },

    // =====================================================
    // MAIN PARSING FUNCTIONS
    // =====================================================

    /**
     * Parse a complete combat log file
     * @param {string} logText - Raw combat log text
     * @returns {Object} Parsed data with encounters and player stats
     */
    parseLog(logText) {
        this.init();

        const lines = logText.split('\n');
        const encounters = [];
        let currentEncounter = null;
        let playerData = {};

        for (const line of lines) {
            if (!line.trim()) continue;

            // Parse combat log line
            const parsed = this.parseLine(line);
            if (!parsed) continue;

            // Detect encounter start
            if (this.isEncounterStart(parsed)) {
                if (currentEncounter) {
                    currentEncounter.endTime = parsed.timestamp;
                    currentEncounter.playerStats = this.calculateStats(playerData, currentEncounter);
                    encounters.push(currentEncounter);
                }
                currentEncounter = {
                    bossName: this.detectBoss(parsed),
                    startTime: parsed.timestamp,
                    endTime: null,
                    events: [],
                    playerStats: {}
                };
                playerData = {};
            }

            // Track damage/healing events
            if (currentEncounter) {
                this.trackEvent(parsed, playerData);
            }
        }

        // Don't forget the last encounter
        if (currentEncounter) {
            currentEncounter.playerStats = this.calculateStats(playerData, currentEncounter);
            encounters.push(currentEncounter);
        }

        return {
            encounters,
            summary: this.generateSummary(encounters)
        };
    },

    /**
     * Parse a single log line
     * @param {string} line - Single line from combat log
     * @returns {Object|null} Parsed event data
     */
    parseLine(line) {
        // WoW combat log format: timestamp  event_type,params...
        // Example: 1/24 20:30:15.123  SPELL_DAMAGE,Player-123,"Chibz",0x511,0x0,Boss-456,"Lord Marrowgar",0x10a48,0x0,49998,"Death Coil",0x20,15000,0,32,0,0,0,nil,nil,nil

        const match = line.match(/^(\d+\/\d+\s+\d+:\d+:\d+\.\d+)\s+(\w+),(.*)$/);
        if (!match) return null;

        const [, timestampStr, eventType, paramsStr] = match;
        const params = this.parseParams(paramsStr);

        return {
            timestamp: this.parseTimestamp(timestampStr),
            eventType,
            params,
            raw: line
        };
    },

    /**
     * Parse comma-separated parameters (handling quoted strings)
     */
    parseParams(paramsStr) {
        const params = [];
        let current = '';
        let inQuotes = false;

        for (const char of paramsStr) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                params.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        params.push(current.trim());

        return params;
    },

    /**
     * Parse timestamp string to Date
     */
    parseTimestamp(str) {
        // Format: M/D HH:MM:SS.mmm
        const [datePart, timePart] = str.split(' ');
        const [month, day] = datePart.split('/');
        const [time, ms] = timePart.split('.');
        const [hours, minutes, seconds] = time.split(':');

        const date = new Date();
        date.setMonth(parseInt(month) - 1);
        date.setDate(parseInt(day));
        date.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds), parseInt(ms));

        return date;
    },

    // =====================================================
    // EVENT TRACKING
    // =====================================================

    /**
     * Check if this event indicates an encounter start
     */
    isEncounterStart(parsed) {
        // Look for ENCOUNTER_START event or boss entering combat
        if (parsed.eventType === 'ENCOUNTER_START') return true;

        // Check for boss unit entering combat
        if (parsed.eventType === 'UNIT_DIED' || parsed.eventType === 'SPELL_DAMAGE') {
            const targetName = parsed.params[5] || '';
            if (this.ALL_BOSSES.some(boss => targetName.includes(boss))) {
                return true;
            }
        }

        return false;
    },

    /**
     * Detect which boss this encounter is for
     */
    detectBoss(parsed) {
        for (const param of parsed.params) {
            for (const boss of this.ALL_BOSSES) {
                if (param.includes(boss)) return boss;
            }
        }
        return 'Unknown Boss';
    },

    /**
     * Track damage/healing events for player stats
     */
    trackEvent(parsed, playerData) {
        const eventType = parsed.eventType;
        const params = parsed.params;

        // Get source player name (usually params[1])
        const sourceName = (params[1] || '').replace(/"/g, '');
        if (!sourceName || sourceName.includes('-') === false && !this.isPlayerName(sourceName)) {
            // Skip non-player sources
        }

        // Initialize player data
        if (sourceName && !playerData[sourceName]) {
            playerData[sourceName] = {
                name: sourceName,
                damage: 0,
                healing: 0,
                damageTaken: 0,
                deaths: 0,
                class: null
            };
        }

        // Track based on event type
        switch (eventType) {
            case 'SPELL_DAMAGE':
            case 'SPELL_PERIODIC_DAMAGE':
            case 'SWING_DAMAGE':
            case 'RANGE_DAMAGE':
                if (sourceName && playerData[sourceName]) {
                    const damageIndex = eventType === 'SWING_DAMAGE' ? 9 : 14;
                    const damage = parseInt(params[damageIndex]) || 0;
                    playerData[sourceName].damage += damage;
                }
                break;

            case 'SPELL_HEAL':
            case 'SPELL_PERIODIC_HEAL':
                if (sourceName && playerData[sourceName]) {
                    const healing = parseInt(params[14]) || 0;
                    const overhealing = parseInt(params[15]) || 0;
                    playerData[sourceName].healing += (healing - overhealing);
                }
                break;

            case 'UNIT_DIED':
                const deadName = (params[5] || '').replace(/"/g, '');
                if (deadName && playerData[deadName]) {
                    playerData[deadName].deaths++;
                }
                break;

            case 'DAMAGE_SHIELD':
            case 'ENVIRONMENTAL_DAMAGE':
                const targetName = (params[5] || '').replace(/"/g, '');
                if (targetName && playerData[targetName]) {
                    const damageTaken = parseInt(params[14]) || 0;
                    playerData[targetName].damageTaken += damageTaken;
                }
                break;
        }
    },

    /**
     * Check if a name looks like a player name (basic heuristic)
     */
    isPlayerName(name) {
        // Player names are typically capitalized single words
        return /^[A-Z][a-z]+$/.test(name);
    },

    // =====================================================
    // STATISTICS CALCULATION
    // =====================================================

    /**
     * Calculate DPS/HPS stats for all players
     */
    calculateStats(playerData, encounter) {
        const duration = encounter.endTime && encounter.startTime
            ? (encounter.endTime - encounter.startTime) / 1000
            : 0;

        const stats = {};

        for (const [name, data] of Object.entries(playerData)) {
            if (data.damage === 0 && data.healing === 0) continue;

            stats[name] = {
                name: data.name,
                class: data.class,
                damage: data.damage,
                healing: data.healing,
                damageTaken: data.damageTaken,
                deaths: data.deaths,
                dps: duration > 0 ? Math.round(data.damage / duration) : 0,
                hps: duration > 0 ? Math.round(data.healing / duration) : 0,
                duration
            };
        }

        // Add rankings
        const sortedByDps = Object.values(stats).sort((a, b) => b.dps - a.dps);
        const sortedByHps = Object.values(stats).sort((a, b) => b.hps - a.hps);

        sortedByDps.forEach((player, index) => {
            stats[player.name].dpsRank = index + 1;
        });

        sortedByHps.forEach((player, index) => {
            stats[player.name].hpsRank = index + 1;
        });

        return stats;
    },

    /**
     * Generate summary statistics across all encounters
     */
    generateSummary(encounters) {
        const playerTotals = {};
        let totalDeaths = 0;
        let totalDuration = 0;

        for (const encounter of encounters) {
            if (encounter.endTime && encounter.startTime) {
                totalDuration += (encounter.endTime - encounter.startTime) / 1000;
            }

            for (const [name, stats] of Object.entries(encounter.playerStats)) {
                if (!playerTotals[name]) {
                    playerTotals[name] = {
                        name,
                        class: stats.class,
                        totalDamage: 0,
                        totalHealing: 0,
                        totalDeaths: 0,
                        fights: 0
                    };
                }

                playerTotals[name].totalDamage += stats.damage;
                playerTotals[name].totalHealing += stats.healing;
                playerTotals[name].totalDeaths += stats.deaths;
                playerTotals[name].fights++;
                totalDeaths += stats.deaths;
            }
        }

        // Calculate averages
        for (const player of Object.values(playerTotals)) {
            player.avgDps = totalDuration > 0
                ? Math.round(player.totalDamage / totalDuration)
                : 0;
            player.avgHps = totalDuration > 0
                ? Math.round(player.totalHealing / totalDuration)
                : 0;
        }

        return {
            encounters: encounters.length,
            totalDuration: Math.round(totalDuration),
            totalDeaths,
            playerTotals,
            topDps: Object.values(playerTotals)
                .sort((a, b) => b.avgDps - a.avgDps)
                .slice(0, 10),
            topHps: Object.values(playerTotals)
                .filter(p => p.totalHealing > 0)
                .sort((a, b) => b.avgHps - a.avgHps)
                .slice(0, 10)
        };
    },

    // =====================================================
    // ROSTER PARSING (From Discord/Raid Helper text)
    // =====================================================

    /**
     * Parse roster text from Discord/Raid Helper
     * Supports multiple formats
     * @param {string} rosterText - Raw roster text
     * @returns {Array} Parsed roster array
     */
    parseRoster(rosterText) {
        const roster = [];
        const lines = rosterText.split('\n');

        let currentRole = null;

        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            // Detect role headers
            const roleLower = line.toLowerCase();
            if (roleLower.includes('tank')) {
                currentRole = 'tank';
                continue;
            } else if (roleLower.includes('heal')) {
                currentRole = 'healer';
                continue;
            } else if (roleLower.includes('dps') || roleLower.includes('melee') || roleLower.includes('ranged')) {
                currentRole = 'dps';
                continue;
            }

            // Try to parse player entry
            const player = this.parsePlayerLine(line, currentRole);
            if (player) {
                roster.push(player);
            }
        }

        return roster;
    },

    /**
     * Parse a single player line
     * Supports formats:
     * - "Chibz - Blood DK"
     * - "Chibz (DK)"
     * - "Chibz DK Blood"
     * - ":check: Chibz - Blood Death Knight"
     */
    parsePlayerLine(line, defaultRole = 'dps') {
        // Remove common Discord emojis/symbols
        line = line.replace(/[:✅✓☑️⏰❌❔🔴🟢🟡⚪]/g, '').trim();

        if (!line) return null;

        // Class detection patterns
        const classPatterns = {
            'death knight': 'deathknight',
            'deathknight': 'deathknight',
            'dk': 'deathknight',
            'druid': 'druid',
            'hunter': 'hunter',
            'mage': 'mage',
            'paladin': 'paladin',
            'pala': 'paladin',
            'priest': 'priest',
            'rogue': 'rogue',
            'shaman': 'shaman',
            'sham': 'shaman',
            'warlock': 'warlock',
            'lock': 'warlock',
            'warrior': 'warrior',
            'war': 'warrior'
        };

        // Spec detection patterns
        const specPatterns = {
            // DK
            'blood': 'Blood',
            'frost': 'Frost',
            'unholy': 'Unholy',
            'unh': 'Unholy',
            // Druid
            'balance': 'Balance',
            'boomkin': 'Balance',
            'boomie': 'Balance',
            'feral': 'Feral',
            'cat': 'Feral',
            'bear': 'Feral',
            'restoration': 'Restoration',
            'resto': 'Restoration',
            // Hunter
            'beast mastery': 'Beast Mastery',
            'bm': 'Beast Mastery',
            'marksmanship': 'Marksmanship',
            'mm': 'Marksmanship',
            'survival': 'Survival',
            'sv': 'Survival',
            // Mage
            'arcane': 'Arcane',
            'fire': 'Fire',
            // Paladin
            'holy': 'Holy',
            'protection': 'Protection',
            'prot': 'Protection',
            'retribution': 'Retribution',
            'ret': 'Retribution',
            // Priest
            'discipline': 'Discipline',
            'disc': 'Discipline',
            'shadow': 'Shadow',
            'sp': 'Shadow',
            // Rogue
            'assassination': 'Assassination',
            'combat': 'Combat',
            'subtlety': 'Subtlety',
            // Shaman
            'elemental': 'Elemental',
            'ele': 'Elemental',
            'enhancement': 'Enhancement',
            'enh': 'Enhancement',
            'enha': 'Enhancement',
            // Warlock
            'affliction': 'Affliction',
            'afli': 'Affliction',
            'demonology': 'Demonology',
            'demo': 'Demonology',
            'destruction': 'Destruction',
            'destro': 'Destruction',
            // Warrior
            'arms': 'Arms',
            'fury': 'Fury'
        };

        // Status detection
        const statusPatterns = {
            'confirmed': 'confirmed',
            'tentative': 'tentative',
            'late': 'late',
            'bench': 'bench',
            'absent': 'absent'
        };

        // Try to extract player name, class, spec, status
        let name = null;
        let playerClass = null;
        let spec = null;
        let status = 'confirmed';
        let role = defaultRole;

        // Common separators: " - ", ", ", " ", "(", ")"
        const normalized = line.toLowerCase();

        // Check for class
        for (const [pattern, classId] of Object.entries(classPatterns)) {
            if (normalized.includes(pattern)) {
                playerClass = classId;
                break;
            }
        }

        // Check for spec
        for (const [pattern, specName] of Object.entries(specPatterns)) {
            if (normalized.includes(pattern)) {
                spec = specName;
                break;
            }
        }

        // Check for status
        for (const [pattern, statusName] of Object.entries(statusPatterns)) {
            if (normalized.includes(pattern)) {
                status = statusName;
                break;
            }
        }

        // Detect role from spec/class
        if (spec) {
            const healSpecs = ['Holy', 'Discipline', 'Restoration'];
            const tankSpecs = ['Blood', 'Protection'];

            if (healSpecs.includes(spec)) {
                role = 'healer';
            } else if (tankSpecs.includes(spec)) {
                role = 'tank';
            }
        }

        // Extract name (usually first word or before separator)
        const namePart = line.split(/[-–,\(\)]/)[0].trim();
        // Remove any remaining symbols
        name = namePart.replace(/[^a-zA-Z]/g, '');

        if (!name || name.length < 2) return null;

        // Capitalize name
        name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

        return {
            name,
            class: playerClass,
            spec,
            role,
            status
        };
    },

    // =====================================================
    // UTILITY FUNCTIONS
    // =====================================================

    /**
     * Format duration in seconds to human readable
     */
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        }
        return `${secs}s`;
    },

    /**
     * Format large numbers (1000 -> 1k, 1000000 -> 1M)
     */
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
    },

    /**
     * Get class color
     */
    getClassColor(className) {
        const colors = {
            'deathknight': '#C41F3B',
            'druid': '#FF7D0A',
            'hunter': '#ABD473',
            'mage': '#69CCF0',
            'paladin': '#F58CBA',
            'priest': '#FFFFFF',
            'rogue': '#FFF569',
            'shaman': '#0070DE',
            'warlock': '#9482C9',
            'warrior': '#C79C6E'
        };
        return colors[className?.toLowerCase()] || '#FFFFFF';
    }
};

// Initialize on load
UwULogParser.init();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UwULogParser;
}
