const fs = require('fs');
const path = require('path');

// Load existing data
const dataPath = path.join(__dirname, '..', 'data', 'top-parsers.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Remove Halion entries
delete data.dps['Halion (Outside)'];
delete data.dps['Halion (Inside)'];

// Reset to ICC only
data.totalLogs = 38;
delete data.logBreakdown; // Remove breakdown since it's just ICC now
data.generated = new Date().toISOString();

// Save
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log('Halion removed');
console.log('Total logs:', data.totalLogs);
