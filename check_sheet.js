

async function checkSheet() {
    const sheetId = '1GR9hWCoRSDntN-oOtdx83hio_7Ol4RvDNRhVGH4310s';
    const sheetName = 'GDD';
    const url = \`https://docs.google.com/spreadsheets/d/\${sheetId}/gviz/tq?tqx=out:json&sheet=\${encodeURIComponent(sheetName)}\`;
    
    const res = await fetch(url);
    const text = await res.text();
    const jsonMatch = text.match(/google\\.visualization\\.Query\\.setResponse\\(([\\s\\S]*)\\);/);
    if (!jsonMatch) return console.log("Failed to parse");
    const data = JSON.parse(jsonMatch[1]);
    
    const rows = data.table.rows;
    // We want to see Rows 0 to 6, Columns FV to FZ (indices 177 to 181, if A is 0)
    // Let's just print the values
    for(let r=0; r<7; r++) {
        if (!rows[r]) continue;
        let cData = rows[r].c;
        let line = \`Row \${r+1}:\`;
        for(let c=170; c<185; c++) {
            if (cData[c]) {
                line += \` [\${c}]: \${cData[c].v}\`;
            }
        }
        console.log(line);
    }
}
checkSheet();
