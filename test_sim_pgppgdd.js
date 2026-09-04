const fs = require('fs');
const vm = require('vm');

const gddDump = JSON.parse(fs.readFileSync('gdd_dump.json', 'utf8').match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/)[1]);
const values = gddDump.table.rows.map(r => r.c.map(c => c ? (c.f || c.v || '') : ''));

const numRows = values.length;
const numCols = values[0].length;

const writes = [];
const sheet = {
    getName: () => 'GDD',
    getLastColumn: () => numCols,
    getDataRange: () => ({
        getValues: () => values
    }),
    getRange: (r, c) => ({
        setValue: (val) => writes.push(`Row ${r}, Col ${c} = "${val}"`),
        clearDataValidations: () => {},
        setDataValidation: () => {},
        setHorizontalAlignment: () => {},
        setBackground: () => {},
        setFontColor: () => {}
    })
};

const context = {
    console,
    sheet,
    SpreadsheetApp: { flush: () => {} },
    indexToColLetter: (idx) => String.fromCharCode(65 + idx),
    applyStatusColor: () => {}
};
vm.createContext(context);

const code = fs.readFileSync('AutoAttendanceAPI.gs', 'utf8');

// Simulate what the frontend sends when the user marks PGPPGDD - I
// Suppose user marks:
// Adithya Vinayan: OD
// Hitesh: P
// KOUSHIK P: OD
// SANJAY T: P
// Piyush Gangde: P
const updates = [
    { rowIndex: 47, name: "Adithya Vinayan", batchYear: "PGPPGDD - I", mark: "OD" },
    { rowIndex: 48, name: "Hitesh Ghanshyam Mehta", batchYear: "PGPPGDD - I", mark: "P" },
    { rowIndex: 49, name: "KOUSHIK P", batchYear: "PGPPGDD - I", mark: "OD" },
    { rowIndex: 50, name: "SANJAY T", batchYear: "PGPPGDD - I", mark: "P" },
    { rowIndex: 51, name: "Piyush Gangde", batchYear: "PGPPGDD - I", mark: "P" }
];

const testScript = `
    const res = saveDepartmentAttendance(sheet, {
        sheetName: "GDD",
        date: "2026-09-04",
        session: "Session 1 (09:15 AM - 11:00 AM)",
        moduleTitle: "Language I",
        moduleTutor: "Sunil PN",
        updates: ${JSON.stringify(updates)}
    });
    console.log("Save result:", res);
`;

vm.runInContext(code + '\n' + testScript, context);
console.log('\n--- WRITES PERFORMED BY SCRIPT ---');
writes.forEach(w => console.log('  ' + w));
