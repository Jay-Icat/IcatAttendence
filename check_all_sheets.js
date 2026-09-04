

async function getSheetTabs() {
    // Unfortunately gviz doesn't give a list of sheets easily without knowing them.
    // Let's just query GT, GDD, MMT, UID
    const sheetId = '1GR9hWCoRSDntN-oOtdx83hio_7Ol4RvDNRhVGH4310s';
    const sheets = ['GT', 'GDD', 'MMT', 'UID', 'Game Tech', 'Animation'];
    
    for (const sheetName of sheets) {
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
        try {
            const res = await fetch(url);
            const text = await res.text();
            const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
            if (!jsonMatch) {
                console.log(`Sheet ${sheetName} not found or no access.`);
                continue;
            }
            const data = JSON.parse(jsonMatch[1]);
            
            // Let's find the first few non-empty rows to understand the structure
            console.log(`\n--- Sheet: ${sheetName} ---`);
            const rows = data.table.rows;
            let logged = 0;
            for(let r=0; r<100 && logged < 15; r++) {
                if (!rows[r]) continue;
                let cData = rows[r].c;
                let hasData = false;
                let line = `Row ${r+1}:`;
                for(let c=0; c<30; c++) { // Just check first 30 columns
                    if (cData[c] && cData[c].v !== null) {
                        line += ` [${c}]: ${String(cData[c].v).substring(0, 20)}`;
                        hasData = true;
                    }
                }
                if (hasData) {
                    console.log(line);
                    logged++;
                }
            }
        } catch(e) {
            console.log(`Error on ${sheetName}: ${e.message}`);
        }
    }
}
getSheetTabs();
