const fs = require('fs');

const gddDump = JSON.parse(fs.readFileSync('gdd_dump.json', 'utf8').match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/)[1]);
const values = gddDump.table.rows.map(r => r.c.map(c => c ? (c.f || c.v || '') : ''));

const numRows = values.length;
const numCols = values[0].length;

// Find all dates in GDD
for (let r = 0; r < Math.min(35, numRows); r++) {
    for (let c = 7; c < numCols; c++) {
        const cell = values[r][c];
        if (!cell) continue;
        const str = String(cell).trim();
        if (str.includes('9/4/2026') || str.includes('2026-09-04')) {
            console.log(`Found 9/4/2026 at Row ${r+1}, Col ${c+1} (c=${c})`);
        }
    }
}
