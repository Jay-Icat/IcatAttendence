const fs = require('fs');

async function inspectGddLeftCols() {
    const sheetId = '1GR9hWCoRSDntN-oOtdx83hio_7Ol4RvDNRhVGH4310s';
    const res = await fetch('https://docs.google.com/spreadsheets/d/' + sheetId + '/gviz/tq?tqx=out:json&sheet=GDD');
    const data = JSON.parse((await res.text()).match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/)[1]);
    
    console.log('--- GDD Rows 40 to 51 (Cols A to G) ---');
    for (let r = 39; r <= 50; r++) {
        const row = data.table.rows[r];
        if (!row) {
            console.log(`Row ${r+1}: EMPTY ROW`);
            continue;
        }
        const cells = [];
        for (let c = 0; c < 7; c++) {
            const cell = row.c[c];
            cells.push(`Col${String.fromCharCode(65+c)}: "${cell ? (cell.f || cell.v || '') : ''}"`);
        }
        console.log(`Row ${r+1}: ${cells.join(' | ')}`);
    }
}

inspectGddLeftCols();
