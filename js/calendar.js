// =====================================================
// RAID CALENDAR
// Interactive calendar component for displaying raids
// =====================================================

const RaidCalendar = {
    currentDate: new Date(),
    raids: [],
    selectedRaid: null,

    // Raid type colors
    RAID_COLORS: {
        'ICC 25 LoD': '#a855f7',      // Purple for heroic
        'ICC 25 8/12': '#22c55e',      // Green for partial
        'ICC 10 HC': '#eab308',        // Yellow
        'RS 25 HC': '#ef4444',         // Red
        'RS 10 HC': '#f97316',         // Orange
        'ToGC 25': '#3b82f6',          // Blue
        'VoA 25': '#6b7280'            // Gray
    },

    /**
     * Initialize the calendar
     * @param {string} containerId - ID of container element
     */
    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Calendar container not found');
            return;
        }

        this.render();
        this.attachEvents();
    },

    /**
     * Set raids data
     * @param {Array} raids - Array of raid objects
     */
    setRaids(raids) {
        this.raids = raids;
        this.render();
    },

    /**
     * Render the calendar
     */
    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = firstDay.getDay(); // 0 = Sunday
        const daysInMonth = lastDay.getDate();

        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        let html = `
            <div class="calendar-wrapper">
                <div class="calendar-header">
                    <button class="calendar-nav prev" onclick="RaidCalendar.prevMonth()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                    </button>
                    <h2 class="calendar-title">${monthNames[month]} ${year}</h2>
                    <button class="calendar-nav next" onclick="RaidCalendar.nextMonth()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"/>
                        </svg>
                    </button>
                </div>

                <div class="calendar-grid">
                    <div class="calendar-weekdays">
                        <span>Sun</span>
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                    </div>
                    <div class="calendar-days">
        `;

        // Empty cells before first day
        for (let i = 0; i < startDay; i++) {
            html += '<div class="calendar-day empty"></div>';
        }

        // Days of the month
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = this.formatDate(date);
            const dayRaids = this.getRaidsForDate(dateStr);
            const isToday = this.isSameDay(date, today);
            const isPast = date < today && !isToday;

            let dayClass = 'calendar-day';
            if (isToday) dayClass += ' today';
            if (isPast) dayClass += ' past';
            if (dayRaids.length > 0) dayClass += ' has-raids';

            html += `
                <div class="${dayClass}" data-date="${dateStr}">
                    <span class="day-number">${day}</span>
                    <div class="day-raids">
            `;

            for (const raid of dayRaids.slice(0, 2)) {
                const color = this.RAID_COLORS[raid.raid_type] || '#6b7280';
                const statusClass = raid.status === 'completed' ? 'completed' : 'upcoming';
                html += `
                    <div class="raid-chip ${statusClass}"
                         style="--raid-color: ${color}"
                         onclick="RaidCalendar.showRaidDetail('${raid.id}')"
                         title="${raid.raid_type} - ${raid.raid_time}">
                        <span class="raid-chip-text">${this.getShortName(raid.raid_type)}</span>
                        <span class="raid-chip-time">${raid.raid_time?.substring(0, 5) || ''}</span>
                    </div>
                `;
            }

            if (dayRaids.length > 2) {
                html += `<div class="more-raids">+${dayRaids.length - 2} more</div>`;
            }

            html += `
                    </div>
                </div>
            `;
        }

        // Empty cells after last day
        const totalCells = startDay + daysInMonth;
        const remainingCells = 7 - (totalCells % 7);
        if (remainingCells < 7) {
            for (let i = 0; i < remainingCells; i++) {
                html += '<div class="calendar-day empty"></div>';
            }
        }

        html += `
                    </div>
                </div>

                <div class="calendar-legend">
                    <span class="legend-item"><span class="legend-dot upcoming"></span> Upcoming</span>
                    <span class="legend-item"><span class="legend-dot completed"></span> Completed</span>
                </div>
            </div>

            <div class="raid-detail-panel" id="raidDetailPanel">
                <div class="raid-detail-content" id="raidDetailContent">
                    <!-- Filled dynamically -->
                </div>
            </div>
        `;

        this.container.innerHTML = html;
    },

    /**
     * Get short name for raid type
     */
    getShortName(raidType) {
        const shortNames = {
            'ICC 25 LoD': 'ICC LoD',
            'ICC 25 8/12': 'ICC 8/12',
            'ICC 10 HC': 'ICC 10',
            'RS 25 HC': 'RS 25',
            'RS 10 HC': 'RS 10',
            'ToGC 25': 'ToGC',
            'VoA 25': 'VoA'
        };
        return shortNames[raidType] || raidType;
    },

    /**
     * Get raids for a specific date
     */
    getRaidsForDate(dateStr) {
        return this.raids.filter(r => r.raid_date === dateStr);
    },

    /**
     * Navigate to previous month
     */
    prevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
        this.fetchRaidsForMonth();
    },

    /**
     * Navigate to next month
     */
    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
        this.fetchRaidsForMonth();
    },

    /**
     * Fetch raids for current month (implement with Supabase)
     */
    async fetchRaidsForMonth() {
        if (typeof db === 'undefined') return;

        try {
            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth() + 1;
            const raids = await db.raids.getByMonth(year, month);
            this.setRaids(raids);
        } catch (error) {
            console.error('Failed to fetch raids:', error);
        }
    },

    /**
     * Show raid detail panel
     */
    showRaidDetail(raidId) {
        const raid = this.raids.find(r => r.id === raidId);
        if (!raid) return;

        this.selectedRaid = raid;
        const panel = document.getElementById('raidDetailPanel');
        const content = document.getElementById('raidDetailContent');

        const color = this.RAID_COLORS[raid.raid_type] || '#6b7280';
        const isCompleted = raid.status === 'completed';
        const roster = raid.roster || [];

        let rosterHtml = '';
        if (roster.length > 0) {
            const tanks = roster.filter(p => p.role === 'tank');
            const healers = roster.filter(p => p.role === 'healer');
            const dps = roster.filter(p => p.role === 'dps');

            rosterHtml = `
                <div class="detail-roster">
                    <h4>Roster (${roster.length})</h4>
                    <div class="roster-mini">
                        ${tanks.length > 0 ? `<div class="roster-mini-group tanks"><span class="role-label">Tanks:</span> ${tanks.map(p => `<span style="color: ${this.getClassColor(p.class)}">${p.name}</span>`).join(', ')}</div>` : ''}
                        ${healers.length > 0 ? `<div class="roster-mini-group healers"><span class="role-label">Healers:</span> ${healers.map(p => `<span style="color: ${this.getClassColor(p.class)}">${p.name}</span>`).join(', ')}</div>` : ''}
                        ${dps.length > 0 ? `<div class="roster-mini-group dps"><span class="role-label">DPS:</span> ${dps.map(p => `<span style="color: ${this.getClassColor(p.class)}">${p.name}</span>`).join(', ')}</div>` : ''}
                    </div>
                </div>
            `;
        }

        content.innerHTML = `
            <div class="detail-header" style="--raid-color: ${color}">
                <div class="detail-status ${raid.status}">${raid.status}</div>
                <button class="detail-close" onclick="RaidCalendar.hideRaidDetail()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="detail-body">
                <h3 class="detail-title">${raid.raid_type}</h3>
                <div class="detail-meta">
                    <span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        ${this.formatDisplayDate(raid.raid_date)}
                    </span>
                    <span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12,6 12,12 16,14"/>
                        </svg>
                        ${raid.raid_time?.substring(0, 5) || 'TBD'} ST
                    </span>
                    <span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                        </svg>
                        Led by ${raid.led_by || 'Waawaa'}
                    </span>
                </div>

                ${raid.notes ? `<p class="detail-notes">${raid.notes}</p>` : ''}

                ${rosterHtml}

                <div class="detail-actions">
                    ${isCompleted && raid.uwu_log_url ? `
                        <a href="${raid.uwu_log_url}" target="_blank" class="btn btn-primary">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            View Log
                        </a>
                    ` : ''}
                    ${!isCompleted && raid.discord_signup_link ? `
                        <a href="${raid.discord_signup_link}" target="_blank" class="btn btn-primary">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                            </svg>
                            Sign Up in Discord
                        </a>
                    ` : ''}
                    ${!isCompleted && !raid.discord_signup_link ? `
                        <p class="detail-no-signup">Sign ups handled in Discord</p>
                    ` : ''}
                </div>
            </div>
        `;

        panel.classList.add('active');
    },

    /**
     * Hide raid detail panel
     */
    hideRaidDetail() {
        const panel = document.getElementById('raidDetailPanel');
        panel.classList.remove('active');
        this.selectedRaid = null;
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
    },

    /**
     * Attach event listeners
     */
    attachEvents() {
        // Click outside to close detail panel
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('raidDetailPanel');
            if (panel && panel.classList.contains('active')) {
                if (!panel.contains(e.target) && !e.target.closest('.raid-chip')) {
                    this.hideRaidDetail();
                }
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideRaidDetail();
            }
        });
    },

    // Utility functions
    formatDate(date) {
        return date.toISOString().split('T')[0];
    },

    formatDisplayDate(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    },

    isSameDay(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RaidCalendar;
}
