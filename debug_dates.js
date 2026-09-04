const fetch = require('node-fetch');

async function debugDateMatch(sheetName, dateStr) {
    const sheetId = '1GR9hWCoRSDntN-oOtdx83hio_7Ol4RvDNRhVGH4310s';
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
    
    try {
        const res = await fetch(url);
        const text = await res.text();
        const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
        if (!jsonMatch) return console.log(`No data for ${sheetName}`);
        
        const data = JSON.parse(jsonMatch[1]);
        const rows = data.table.rows;
        
        let targetMonth = 9, targetDay = 4, targetYear = 2026;
        let m_d_y = targetMonth + '/' + targetDay + '/' + targetYear;
        let d_m_y = targetDay + '/' + targetMonth + '/' + targetYear;
        let m_d = targetMonth + '/' + targetDay;
        let d_m = targetDay + '/' + targetMonth;
        let targetDayName = "Friday";

        console.log(`\n--- Debugging Sheet: ${sheetName} ---`);
        for (let r = 0; r < Math.min(200, rows.length); r++) {
            if (!rows[r]) continue;
            let cData = rows[r].c;
            for (let c = 7; c < 50; c++) {
                if (!cData[c] || cData[c].v === null) continue;
                
                let cellVal = cData[c].v;
                let cellFormatted = cData[c].f || String(cellVal);
                
                let isMatch = false;
                let matchReason = "";
                
                // GViz returns dates as "Date(YYYY, M, D)" where M is 0-indexed
                if (typeof cellVal === 'string' && cellVal.startsWith('Date(')) {
                    let parts = cellVal.match(/Date\((\d+),\s*(\d+),\s*(\d+)/);
                    if (parts) {
                        let y = parseInt(parts[1]);
                        let m = parseInt(parts[2]) + 1; // GViz months are 0-indexed!
                        let d = parseInt(parts[3]);
                        if (d === targetDay && m === targetMonth) {
                            isMatch = true;
                            matchReason = `Date Object Match: ${y}-${m}-${d}`;
                        }
                    }
                } else {
                    let str = String(cellFormatted).trim();
                    if (str === m_d_y || str === d_m_y || str === m_d || str === d_m || str === dateStr ||
                        str.indexOf(m_d_y) !== -1 || str.indexOf(d_m_y) !== -1 || str.indexOf(dateStr) !== -1) {
                        isMatch = true;
                        matchReason = `Exact String Match: ${str}`;
                    } else if (targetDayName && str.toLowerCase() === targetDayName.toLowerCase()) {
                        isMatch = true;
                        matchReason = `Day Name Match: ${str}`;
                    }
                }
                
                if (isMatch) {
                    console.log(`Found match at Row ${r+1}, Col ${c} (GViz index). Reason: ${matchReason}`);
                }
            }
        }
    } catch(e) {
        console.log(e);
    }
}

async function run() {
    await debugDateMatch('MMT', '2026-09-04');
    await debugDateMatch('GDD', '2026-09-04');
    await debugDateMatch('PGPPGDD', '2026-09-04');
}
run();
