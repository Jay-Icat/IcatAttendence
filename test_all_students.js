const fs = require('fs');

async function testFetchStudents() {
    const sheetId = '1GR9hWCoRSDntN-oOtdx83hio_7Ol4RvDNRhVGH4310s';
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=GDD`;
    const res = await fetch(url);
    const data = JSON.parse((await res.text()).match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/)[1]);
    const rows = data.table.rows;

    console.log('Total GViz rows:', rows.length);
    for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        if (!row || !row.c) continue;
        const colA = row.c[0]?.v;
        const colB = row.c[1]?.v;
        const colC = row.c[2]?.v;
        const colD = row.c[3]?.v;
        if (colB) {
            console.log(`Row ${r+1}: A="${colA}", B="${colB}", C="${colC}", D="${colD}"`);
        }
    }
}

testFetchStudents();
