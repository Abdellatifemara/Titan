// =====================================================
// ROSTER PARSER
// Parses roster text from Discord/Raid Helper
// Supports multiple input formats
// =====================================================

const RosterParser = {
    // WoW Class definitions
    CLASSES: {
        deathknight: {
            name: 'Death Knight',
            color: '#C41F3B',
            specs: ['Blood', 'Frost', 'Unholy'],
            aliases: ['dk', 'death knight', 'deathknight']
        },
        druid: {
            name: 'Druid',
            color: '#FF7D0A',
            specs: ['Balance', 'Feral', 'Restoration'],
            aliases: ['druid', 'dru']
        },
        hunter: {
            name: 'Hunter',
            color: '#ABD473',
            specs: ['Beast Mastery', 'Marksmanship', 'Survival'],
            aliases: ['hunter', 'hunt']
        },
        mage: {
            name: 'Mage',
            color: '#69CCF0',
            specs: ['Arcane', 'Fire', 'Frost'],
            aliases: ['mage']
        },
        paladin: {
            name: 'Paladin',
            color: '#F58CBA',
            specs: ['Holy', 'Protection', 'Retribution'],
            aliases: ['paladin', 'pala', 'pally', 'pal']
        },
        priest: {
            name: 'Priest',
            color: '#FFFFFF',
            specs: ['Discipline', 'Holy', 'Shadow'],
            aliases: ['priest']
        },
        rogue: {
            name: 'Rogue',
            color: '#FFF569',
            specs: ['Assassination', 'Combat', 'Subtlety'],
            aliases: ['rogue', 'rog']
        },
        shaman: {
            name: 'Shaman',
            color: '#0070DE',
            specs: ['Elemental', 'Enhancement', 'Restoration'],
            aliases: ['shaman', 'sham', 'shammy']
        },
        warlock: {
            name: 'Warlock',
            color: '#9482C9',
            specs: ['Affliction', 'Demonology', 'Destruction'],
            aliases: ['warlock', 'lock']
        },
        warrior: {
            name: 'Warrior',
            color: '#C79C6E',
            specs: ['Arms', 'Fury', 'Protection'],
            aliases: ['warrior', 'war', 'warr']
        }
    },

    // Spec aliases mapping
    SPEC_ALIASES: {
        // Death Knight
        'blood': 'Blood',
        'frost': 'Frost',
        'unholy': 'Unholy',
        'unh': 'Unholy',
        'uh': 'Unholy',

        // Druid
        'balance': 'Balance',
        'boomkin': 'Balance',
        'boomie': 'Balance',
        'boom': 'Balance',
        'owl': 'Balance',
        'feral': 'Feral',
        'cat': 'Feral',
        'bear': 'Feral',
        'resto': 'Restoration',
        'restoration': 'Restoration',
        'rdudu': 'Restoration',
        'tree': 'Restoration',

        // Hunter
        'bm': 'Beast Mastery',
        'beast mastery': 'Beast Mastery',
        'mm': 'Marksmanship',
        'marks': 'Marksmanship',
        'marksmanship': 'Marksmanship',
        'sv': 'Survival',
        'surv': 'Survival',
        'survival': 'Survival',

        // Mage
        'arcane': 'Arcane',
        'fire': 'Fire',
        // frost already defined for DK

        // Paladin
        'holy': 'Holy',
        'hpala': 'Holy',
        'hpal': 'Holy',
        'prot': 'Protection',
        'protection': 'Protection',
        'ret': 'Retribution',
        'retri': 'Retribution',
        'retribution': 'Retribution',

        // Priest
        'disc': 'Discipline',
        'disco': 'Discipline',
        'discipline': 'Discipline',
        'discop': 'Discipline',
        // holy already defined
        'shadow': 'Shadow',
        'sp': 'Shadow',
        'spriest': 'Shadow',

        // Rogue
        'assa': 'Assassination',
        'assassin': 'Assassination',
        'assassination': 'Assassination',
        'combat': 'Combat',
        'sub': 'Subtlety',
        'subtlety': 'Subtlety',

        // Shaman
        'ele': 'Elemental',
        'elem': 'Elemental',
        'elemental': 'Elemental',
        'enh': 'Enhancement',
        'enha': 'Enhancement',
        'enhance': 'Enhancement',
        'enhancement': 'Enhancement',
        'rsham': 'Restoration',
        'rshamy': 'Restoration',

        // Warlock
        'afli': 'Affliction',
        'affli': 'Affliction',
        'affliction': 'Affliction',
        'demo': 'Demonology',
        'demonology': 'Demonology',
        'destro': 'Destruction',
        'destruction': 'Destruction',

        // Warrior
        'arms': 'Arms',
        'fury': 'Fury',
        'fwar': 'Fury',
        'fwarr': 'Fury'
        // protection already defined
    },

    // Status indicators
    STATUS_INDICATORS: {
        // Confirmed
        '✅': 'confirmed',
        '✓': 'confirmed',
        '☑': 'confirmed',
        ':white_check_mark:': 'confirmed',
        'confirmed': 'confirmed',

        // Tentative
        '❔': 'tentative',
        '❓': 'tentative',
        ':question:': 'tentative',
        'tentative': 'tentative',
        'maybe': 'tentative',

        // Late
        '⏰': 'late',
        ':clock:': 'late',
        'late': 'late',

        // Bench
        '🪑': 'bench',
        'bench': 'bench',
        'benched': 'bench',

        // Absent
        '❌': 'absent',
        ':x:': 'absent',
        'absent': 'absent',
        'out': 'absent'
    },

    /**
     * Main parsing function - parses roster text to structured array
     * @param {string} text - Raw roster text from Discord
     * @returns {Object} Parsed roster with players grouped by role
     */
    parse(text) {
        const lines = text.split('\n');
        const roster = {
            tanks: [],
            healers: [],
            dps: [],
            unknown: []
        };

        let currentRole = 'dps'; // Default role

        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            // Check if this line is a role header
            const detectedRole = this.detectRoleHeader(line);
            if (detectedRole) {
                currentRole = detectedRole;
                continue;
            }

            // Try to parse player from line
            const player = this.parsePlayerLine(line, currentRole);
            if (player) {
                // Categorize by role
                switch (player.role) {
                    case 'tank':
                        roster.tanks.push(player);
                        break;
                    case 'healer':
                        roster.healers.push(player);
                        break;
                    case 'dps':
                        roster.dps.push(player);
                        break;
                    default:
                        roster.unknown.push(player);
                }
            }
        }

        // Calculate stats
        const stats = {
            total: roster.tanks.length + roster.healers.length + roster.dps.length + roster.unknown.length,
            tanks: roster.tanks.length,
            healers: roster.healers.length,
            dps: roster.dps.length,
            confirmed: [...roster.tanks, ...roster.healers, ...roster.dps, ...roster.unknown]
                .filter(p => p.status === 'confirmed').length,
            tentative: [...roster.tanks, ...roster.healers, ...roster.dps, ...roster.unknown]
                .filter(p => p.status === 'tentative').length,
            late: [...roster.tanks, ...roster.healers, ...roster.dps, ...roster.unknown]
                .filter(p => p.status === 'late').length,
            bench: [...roster.tanks, ...roster.healers, ...roster.dps, ...roster.unknown]
                .filter(p => p.status === 'bench').length
        };

        // Count classes
        const classCounts = {};
        const allPlayers = [...roster.tanks, ...roster.healers, ...roster.dps];
        for (const player of allPlayers) {
            if (player.class) {
                classCounts[player.class] = (classCounts[player.class] || 0) + 1;
            }
        }

        return {
            roster,
            stats,
            classCounts,
            raw: text
        };
    },

    /**
     * Detect if a line is a role header
     */
    detectRoleHeader(line) {
        const lower = line.toLowerCase();

        // Tank patterns
        if (/^(tanks?|:shield:|🛡️)/i.test(lower)) return 'tank';

        // Healer patterns
        if (/^(healers?|heals?|:ambulance:|💚|🏥)/i.test(lower)) return 'healer';

        // DPS patterns (melee and ranged)
        if (/^(dps|damage|melee|ranged|:crossed_swords:|⚔️|🗡️)/i.test(lower)) return 'dps';

        return null;
    },

    /**
     * Parse a single player line
     */
    parsePlayerLine(line, defaultRole = 'dps') {
        // Remove common prefixes/suffixes and emojis
        let cleaned = line
            .replace(/^[\d\.\)\-\*\#]+\s*/, '') // Remove numbering
            .replace(/[🛡️💚⚔️🗡️]/g, '')  // Remove role emojis
            .trim();

        if (!cleaned) return null;

        // Extract status first (before removing other things)
        let status = 'confirmed';
        for (const [indicator, statusValue] of Object.entries(this.STATUS_INDICATORS)) {
            if (cleaned.includes(indicator)) {
                status = statusValue;
                cleaned = cleaned.replace(indicator, '').trim();
                break;
            }
        }

        // Common patterns to match:
        // "Chibz - Blood DK"
        // "Chibz (Blood DK)"
        // "Chibz Blood DK"
        // "Chibz - DK Blood"
        // "Chibz DK"

        let name = null;
        let playerClass = null;
        let spec = null;
        let role = defaultRole;

        // Try pattern: "Name - Spec Class" or "Name - Class Spec"
        let match = cleaned.match(/^([A-Za-z]+)\s*[-–]\s*(.+)$/);
        if (match) {
            name = match[1];
            const rest = match[2].toLowerCase();
            [playerClass, spec] = this.extractClassSpec(rest);
        }

        // Try pattern: "Name (Spec Class)" or "Name (Class)"
        if (!name) {
            match = cleaned.match(/^([A-Za-z]+)\s*\(([^)]+)\)$/);
            if (match) {
                name = match[1];
                const rest = match[2].toLowerCase();
                [playerClass, spec] = this.extractClassSpec(rest);
            }
        }

        // Try pattern: "Name Class" or "Name Spec Class"
        if (!name) {
            const words = cleaned.split(/\s+/);
            if (words.length >= 1) {
                // First word is likely name
                const possibleName = words[0].replace(/[^A-Za-z]/g, '');
                if (possibleName.length >= 2) {
                    name = possibleName;
                    const rest = words.slice(1).join(' ').toLowerCase();
                    [playerClass, spec] = this.extractClassSpec(rest);
                }
            }
        }

        // Validate we have at least a name
        if (!name || name.length < 2) return null;

        // Capitalize name
        name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

        // Determine role from spec/class if not explicitly set
        if (spec) {
            const tankSpecs = ['Blood', 'Protection'];
            const healSpecs = ['Holy', 'Discipline', 'Restoration'];

            if (tankSpecs.includes(spec)) {
                role = 'tank';
            } else if (healSpecs.includes(spec)) {
                role = 'healer';
            }
        }

        // Get class color
        const classData = playerClass ? this.CLASSES[playerClass] : null;
        const color = classData ? classData.color : '#FFFFFF';

        return {
            name,
            class: playerClass,
            className: classData ? classData.name : null,
            spec,
            role,
            status,
            color
        };
    },

    /**
     * Extract class and spec from text
     */
    extractClassSpec(text) {
        let foundClass = null;
        let foundSpec = null;

        // Look for class
        for (const [classId, classData] of Object.entries(this.CLASSES)) {
            for (const alias of classData.aliases) {
                if (text.includes(alias)) {
                    foundClass = classId;
                    break;
                }
            }
            if (foundClass) break;
        }

        // Look for spec
        for (const [alias, specName] of Object.entries(this.SPEC_ALIASES)) {
            if (text.includes(alias)) {
                foundSpec = specName;
                break;
            }
        }

        return [foundClass, foundSpec];
    },

    /**
     * Convert parsed roster to JSON for storage
     */
    toJSON(parsedRoster) {
        const all = [
            ...parsedRoster.roster.tanks,
            ...parsedRoster.roster.healers,
            ...parsedRoster.roster.dps,
            ...parsedRoster.roster.unknown
        ];

        return all.map(p => ({
            name: p.name,
            class: p.class,
            spec: p.spec,
            role: p.role,
            status: p.status
        }));
    },

    /**
     * Generate HTML preview of roster
     */
    toHTML(parsedRoster) {
        const { roster, stats, classCounts } = parsedRoster;

        let html = '<div class="roster-preview">';

        // Stats bar
        html += `
            <div class="roster-stats">
                <span><strong>${stats.total}</strong> players</span>
                <span>${stats.tanks} tanks</span>
                <span>${stats.healers} healers</span>
                <span>${stats.dps} dps</span>
            </div>
        `;

        // Tanks
        if (roster.tanks.length > 0) {
            html += '<div class="roster-group tanks">';
            html += '<h4>Tanks</h4>';
            html += this.renderPlayerList(roster.tanks);
            html += '</div>';
        }

        // Healers
        if (roster.healers.length > 0) {
            html += '<div class="roster-group healers">';
            html += '<h4>Healers</h4>';
            html += this.renderPlayerList(roster.healers);
            html += '</div>';
        }

        // DPS
        if (roster.dps.length > 0) {
            html += '<div class="roster-group dps">';
            html += '<h4>DPS</h4>';
            html += this.renderPlayerList(roster.dps);
            html += '</div>';
        }

        html += '</div>';
        return html;
    },

    /**
     * Render a list of players as HTML
     */
    renderPlayerList(players) {
        return '<div class="player-list">' +
            players.map(p => `
                <div class="player-item">
                    <span class="player-name" style="color: ${p.color}">${p.name}</span>
                    <span class="player-spec">${p.spec || ''} ${p.className || ''}</span>
                    <span class="player-status status-${p.status}"></span>
                </div>
            `).join('') +
            '</div>';
    },

    /**
     * Get class info by ID
     */
    getClassInfo(classId) {
        return this.CLASSES[classId] || null;
    },

    /**
     * Get class color
     */
    getClassColor(classId) {
        const classData = this.CLASSES[classId];
        return classData ? classData.color : '#FFFFFF';
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RosterParser;
}
