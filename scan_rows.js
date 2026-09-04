const fs = require('fs');

async function scanRow45and46() {
    const sheetId = '1GR9hWCoRSDntN-oOtdx83hio_7Ol4RvDNRhVGH4310s';
    const res = await fetch('https://docs.google.com/spreadsheets/d/' + sheetId + '/gviz/tq?tqx=out:json&sheet=GDD');
    const data = JSON.parse((await res.text()).match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/)[1]);
    
    console.log('--- Scanning Row 45 (0-indexed 44) across all cols ---');
    const r45 = data.table.rows[44];
    const r46 = data.table.rows[45];
    for (let c = 7; c < data.table.cols.length; c++) {
        const v45 = r45?.c[c]?.v;
        const v46 = r46?.c[c]?.v;
        if (v45 || v46) {
            console.log(`Col ${c+1} (idx ${c}): Row45="${v45 || ''}", Row46="${v46 || ''}"`);
        }
    }
}

scanRow45and46();
