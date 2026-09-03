const fs = require('fs');
let code = fs.readFileSync('google_apps_script.js', 'utf8');

code = code.replace(/function doPost[\s\S]*?return ContentService[\s\S]*?}/, '');
code = code.replace(/function doGet[\s\S]*?return ContentService[\s\S]*?}/, '');
code = code.replace(/SpreadsheetApp/g, 'MockSpreadsheetApp');

const mockValues = [];
for(let i=0; i<100; i++) mockValues.push(new Array(200).fill(''));

// GDD II
mockValues[0][178] = "9/3/2026"; // FW is col 178 (F=5, W=22 -> 5*26 + 22 = 152? Wait. A=0. Z=25. AA=26. FW = 6 * 26 + 22 = 156 + 22 = 178? FW: F is 6th letter, W is 23rd. 6*26 + 23 = 179? A=1.. Z=26. FW = 6*26 + 23 = 179. 0-indexed: 178)
mockValues[1][178] = "Thursday";
mockValues[2][178] = "Language I";
mockValues[3][178] = "S1"; // sessionRowIdx = 4

mockValues[5][1] = "Student Name";
mockValues[5][2] = "Dept";
mockValues[5][3] = "Year";
mockValues[6][1] = "Agnibhu Mitra";
mockValues[6][2] = "GDD";
mockValues[6][3] = "II";

// Run the script
let rangeValues = mockValues;
const mockSheet = {
  getName: () => "GDD",
  getDataRange: () => ({ getValues: () => rangeValues }),
  getLastColumn: () => 200,
  getRange: (r, c) => ({
    setValue: (v) => { console.log(`Set [${r}, ${c}] to ${v}`); },
    setHorizontalAlignment: () => {},
    setBackground: () => {},
    setFontColor: () => {},
    setFontWeight: () => {}
  })
};

const MockSpreadsheetApp = {
  getActiveSpreadsheet: () => ({
    getSheets: () => [mockSheet],
    getSheetByName: () => mockSheet
  })
};

eval(code);

const params = {
  sheetName: "GDD",
  date: "2026-09-03",
  session: "Session 1", // S1
  moduleTitle: "Health & Wellness And",
  moduleTutor: "Sandeep S Anand",
  updates: [
    {
      rowIndex: 7,
      rollNo: "1",
      name: "Agnibhu Mitra",
      batchYear: "GDD - II",
      mark: "P"
    }
  ]
};

try {
  console.log("Running GDD II test...");
  saveDepartmentAttendance(mockSheet, params);
} catch(e) {
  console.error("Error:", e);
}
