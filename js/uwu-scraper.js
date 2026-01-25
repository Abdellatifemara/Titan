async function fetchUwuHtml(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        return html;
    } catch (error) {
        console.error(`Error fetching URL ${url}:`, error);
        return null;
    }
}

function parseDbDpsFromUwu(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const rows = doc.querySelectorAll('table.summary-table tbody tr');

    for (const row of rows) {
        const bossCell = row.querySelector('td:nth-child(2) a');
        if (bossCell && bossCell.textContent.trim() === 'Deathbringer Saurfang') {
            const dpsCell = row.querySelector('td:nth-child(3) span');
            if (dpsCell) {
                return parseFloat(dpsCell.textContent.replace(/,/g, ''));
            }
        }
    }

    return null;
}