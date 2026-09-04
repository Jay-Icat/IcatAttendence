const fs = require('fs');

async function checkGddExactRows() {
    const sheetId = '1GR9hWCoRSDntN-oOtdx83hio_7Ol4RvDNRhVGH4310s';
    const res = await fetch('https://docs.google.com/spreadsheets/d/' + sheetId + '/gviz/tq?tqx=out:json&sheet=GDD');
    const data = JSON.parse((await res.text()).match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/)[1]);
    for (let r = 41; r < data.table.rows.length; r++) {
        const row = data.table.rows[r];
        const a = row?.c[0]?.v || '';
        const b = row?.c[1]?.v || '';
        const c181 = row?.c[181]?.v || '';
        const c182 = row?.c[182]?.v || '';
        const c183 = row?.c[183]?.v || '';
        console.log(`Row ${r+1}: colA='${a}' | colB='${b}' | Col182='${c181}' | Col183='${c182}' | Col184='${c183}'`);
    }
}

checkGddExactRows();
