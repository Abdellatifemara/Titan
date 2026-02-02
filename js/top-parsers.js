// Class data
const classData = {
    'Death Knight': { color: '#C41F3B', icon: 'icons/deathknight.png', css: 'class-deathknight' },
    'Druid': { color: '#FF7D0A', icon: 'icons/druid.png', css: 'class-druid' },
    'Hunter': { color: '#ABD473', icon: 'icons/hunter.png', css: 'class-hunter' },
    'Mage': { color: '#69CCF0', icon: 'icons/mage.png', css: 'class-mage' },
    'Paladin': { color: '#F58CBA', icon: 'icons/paladin.png', css: 'class-paladin' },
    'Priest': { color: '#FFFFFF', icon: 'icons/priest.png', css: 'class-priest' },
    'Rogue': { color: '#FFF569', icon: 'icons/rogue.png', css: 'class-rogue' },
    'Shaman': { color: '#0070DE', icon: 'icons/shaman.png', css: 'class-shaman' },
    'Warlock': { color: '#9482C9', icon: 'icons/warlock.png', css: 'class-warlock' },
    'Warrior': { color: '#C79C6E', icon: 'icons/warrior.png', css: 'class-warrior' }
};

const bossOrder = [
    'Lord Marrowgar',
    'Lady Deathwhisper',
    'Deathbringer Saurfang',
    'Rotface',
    'Festergut',
    'Professor Putricide',
    'Blood Prince Council',
    'Blood-Queen Lana\'thel',
    'Sindragosa',
    'The Lich King',
    'Halion (Outside)',
    'Halion (Inside)'
];

let rankingsData = null;

async function loadRankings() {
    try {
        const response = await fetch('data/top-parsers.json');
        rankingsData = await response.json();

        // Display log count with breakdown
        const breakdown = rankingsData.logBreakdown;
        if (breakdown) {
            document.getElementById('logCount').innerHTML =
                `${rankingsData.totalLogs} <span class="log-breakdown">(${breakdown.icc} LoD, ${breakdown.halion} Halion)</span>`;
        } else {
            document.getElementById('logCount').textContent = rankingsData.totalLogs;
        }

        document.getElementById('dateRange').textContent =
            `${rankingsData.dateRange.from} to ${rankingsData.dateRange.to}`;
        document.getElementById('lastUpdated').textContent =
            `Last updated: ${new Date(rankingsData.generated).toLocaleDateString()}`;

        renderDPSRankings();
    } catch (error) {
        document.getElementById('bossContainer').innerHTML = `
            <div class="loading">
                <p style="color: var(--horde-red);">Error loading rankings: ${error.message}</p>
            </div>
        `;
    }
}

function renderTopAllTime() {
    if (!rankingsData || !rankingsData.dps) return '';

    let html = `
        <div class="top-alltime-section">
            <h2 class="section-title">Top All Time</h2>
            <table class="top-table top-alltime-table">
                <thead>
                    <tr>
                        <th>Boss</th>
                        <th>Champion</th>
                        <th>Class</th>
                        <th>DPS</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
    `;

    bossOrder.forEach(bossName => {
        const boss = rankingsData.dps[bossName];
        if (!boss || !boss.bestOverall) return;

        const best = boss.bestOverall;
        const cls = classData[best.class] || { css: '', color: '#666' };

        html += `
            <tr>
                <td class="boss-name-cell">${bossName}</td>
                <td class="${cls.css}"><span class="alltime-crown">👑</span> ${best.player}</td>
                <td style="color: ${cls.color};">${best.class}</td>
                <td class="table-dps">${formatNumber(best.dps)}</td>
                <td class="table-date">${best.date || '-'}</td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';
    return html;
}

function renderDPSRankings() {
    const container = document.getElementById('bossContainer');
    if (!rankingsData || !rankingsData.dps) {
        container.innerHTML = '<p style="color: var(--text-muted);">No data available.</p>';
        return;
    }

    let html = renderTopAllTime();

    html += '<h2 class="section-title" style="margin-top: 40px;">Boss Breakdowns</h2>';

    bossOrder.forEach(bossName => {
        const boss = rankingsData.dps[bossName];
        if (!boss || !boss.bestOverall) return;

        const isDeathbringer = bossName === 'Deathbringer Saurfang';
        const best = boss.bestOverall;
        const cls = classData[best.class] || { css: '', icon: '', color: '#666' };

        html += `
            <div class="boss-card ${isDeathbringer ? 'deathbringer-special' : ''}" data-boss="${bossName}">
                <div class="boss-card-header" onclick="toggleBoss(this)">
                    <div class="boss-card-title">
                        <span class="boss-card-name">${bossName}</span>
                    </div>
                    <svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
                <div class="boss-card-content">
                    <h4 style="color: var(--text-secondary); margin-bottom: 16px; font-size: 0.9rem;">Best by Class</h4>
                    <div class="class-grid">
                        ${renderClassCards(boss.bestByClass, 'dps')}
                    </div>
                    <h4 style="color: var(--text-secondary); margin-bottom: 16px; font-size: 0.9rem;">Top 10 All-Time</h4>
                    ${renderTopTable(boss.topPerformances, 'dps')}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function renderClassCards(bestByClass, type) {
    if (!bestByClass) return '<p style="color: var(--text-muted);">No data</p>';

    const sorted = Object.entries(bestByClass).sort((a, b) => {
        const valA = type === 'dps' ? a[1].dps : a[1].hps;
        const valB = type === 'dps' ? b[1].dps : b[1].hps;
        return valB - valA;
    });

    return sorted.map(([className, data]) => {
        const cls = classData[className] || { icon: '', css: '', color: '#666' };
        const value = type === 'dps' ? data.dps : data.hps;
        return `
            <div class="class-card">
                <img src="${cls.icon}" alt="${className}" class="class-card-icon">
                <div class="class-card-info">
                    <div class="class-card-class" style="color: ${cls.color};">${className}</div>
                    <div class="class-card-player">${data.player}</div>
                </div>
                <div class="class-card-value ${type}">${formatNumber(value)}</div>
            </div>
        `;
    }).join('');
}

function renderTopTable(topPerfs, type) {
    if (!topPerfs || topPerfs.length === 0) return '';

    const valueKey = type === 'dps' ? 'dps' : 'hps';
    const valueClass = type === 'dps' ? 'table-dps' : 'table-hps';

    let html = `
        <div class="top-table-wrapper">
        <table class="top-table">
            <thead>
                <tr>
                    <th style="width: 50px;">#</th>
                    <th>Player</th>
                    <th>Class</th>
                    <th>${type.toUpperCase()}</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
    `;

    topPerfs.slice(0, 10).forEach((perf, idx) => {
        const cls = classData[perf.class] || { css: '', color: '#666' };
        const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'rank-other';

        html += `
            <tr>
                <td><span class="rank-badge ${rankClass}">${idx + 1}</span></td>
                <td class="${cls.css}">${perf.player}</td>
                <td style="color: ${cls.color};">${perf.class}</td>
                <td class="${valueClass}">${formatNumber(perf[valueKey])}</td>
                <td class="table-date">${perf.date || '-'}</td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';
    return html;
}

function formatNumber(num) {
    if (num >= 1000) {
        return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
    }
    return num.toFixed(1);
}

function toggleBoss(header) {
    const card = header.closest('.boss-card');
    card.classList.toggle('expanded');
}

// Mobile nav
document.getElementById('navToggle').addEventListener('click', function() {
    this.classList.toggle('active');
    document.querySelector('.nav-links').classList.toggle('active');
});

window.addEventListener('scroll', () => {
    document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 50);
});

// Load on page ready
loadRankings();
