async function checkSheet() {
    const sheetId = '1GR9hWCoRSDntN-oOtdx83hio_7Ol4RvDNRhVGH4310s';
    const sheetName = 'GDD';
    const url = "https://docs.google.com/spreadsheets/d/" + sheetId + "/gviz/tq?tqx=out:json&sheet=" + encodeURIComponent(sheetName);
    
    const res = await fetch(url);
    const text = await res.text();
    const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
    if (!jsonMatch) return;
    const data = JSON.parse(jsonMatch[1]);
    
    const rows = data.table.rows;
    for(let r=4; r<12; r++) {
        if (!rows[r]) continue;
        let cData = rows[r].c;
        let line = "Row " + (r+1) + ":";
        for(let c=15; c<25; c++) {
            if (cData[c] && cData[c].v !== null) {
                line += " [" + c + "]: " + cData[c].v;
            }
        }
        if (line.includes('[')) console.log(line);
    }
}
checkSheet();
