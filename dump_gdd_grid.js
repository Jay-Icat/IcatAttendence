const fs = require('fs');

async function dumpGddGrid() {
    const sheetId = '1GR9hWCoRSDntN-oOtdx83hio_7Ol4RvDNRhVGH4310s';
    const res = await fetch('https://docs.google.com/spreadsheets/d/' + sheetId + '/gviz/tq?tqx=out:json&sheet=GDD');
    const data = JSON.parse((await res.text()).match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/)[1]);
    
    console.log('Row 1 (Date):');
    for (let c = 177; c <= 184; c++) {
        console.log(`  Col ${c+1} (idx ${c}): "${data.table.rows[0]?.c[c]?.v || ''}"`);
    }
    
    console.log('\nRow 2 (Day):');
    for (let c = 177; c <= 184; c++) {
        console.log(`  Col ${c+1} (idx ${c}): "${data.table.rows[1]?.c[c]?.v || ''}"`);
    }

    console.log('\nRow 5 (Session Row 1):');
    for (let c = 177; c <= 184; c++) {
        console.log(`  Col ${c+1} (idx ${c}): "${data.table.rows[4]?.c[c]?.v || ''}"`);
    }

    console.log('\nRow 46 (Session Row PGPPGDD):');
    for (let c = 177; c <= 184; c++) {
        console.log(`  Col ${c+1} (idx ${c}): "${data.table.rows[45]?.c[c]?.v || ''}"`);
    }

    console.log('\nRow 44 (Title Row PGPPGDD):');
    for (let c = 177; c <= 184; c++) {
        console.log(`  Col ${c+1} (idx ${c}): "${data.table.rows[43]?.c[c]?.v || ''}"`);
    }

    console.log('\nRow 45 (Tutor Row PGPPGDD):');
    for (let c = 177; c <= 184; c++) {
        console.log(`  Col ${c+1} (idx ${c}): "${data.table.rows[44]?.c[c]?.v || ''}"`);
    }
}

dumpGddGrid();
