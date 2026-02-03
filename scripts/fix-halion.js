const fs = require('fs');
const path = require('path');

// Load existing data
const dataPath = path.join(__dirname, '..', 'data', 'top-parsers.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Remove incorrect Halion entries - will be re-added with correct phase-specific data
delete data.dps['Halion (Outside)'];
delete data.dps['Halion (Inside)'];

// Update metadata
data.totalLogs = 38; // Back to just ICC logs until we add correct Halion
data.logBreakdown = {
    icc: 38,
    halion: 0
};
data.generated = new Date().toISOString();

// Save
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log('Removed incorrect Halion entries');
console.log('Total logs:', data.totalLogs);
