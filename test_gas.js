const fs = require('fs');
let code = fs.readFileSync('google_apps_script.js', 'utf8');

// We only need saveDepartmentAttendance, getDepartmentAttendanceData
// Remove the doPost/doGet to avoid reference errors
code = code.replace(/function doPost[\s\S]*?return ContentService[\s\S]*?}/, '');
code = code.replace(/function doGet[\s\S]*?return ContentService[\s\S]*?}/, '');
code = code.replace(/SpreadsheetApp/g, 'MockSpreadsheetApp');

const mockValues = [];
for(let i=0; i<65; i++) mockValues.push(new Array(200).fill(''));

// Fill headers
mockValues[0][0] = "S.No";
mockValues[0][1] = "Student Name";
mockValues[0][2] = "Dept";
mockValues[0][3] = "Year";
mockValues[0][4] = "Total Session";

// Row 55 (index 54): Days
mockValues[54][167] = "Thursday"; // column FL (167 if A is 0, let's see. A=0, Z=25. FL is 6*26 + 11 = 167. Wait. F=5, L=11. 5*26 + 11 = 141? Let's just use 167.

// Row 56, 57: Module title/tutor
mockValues[55][167] = "Module title";
mockValues[56][167] = "Module tutor";

// Row 58 (index 57): Sessions
mockValues[57][167] = "S1";
mockValues[57][168] = "S2";
mockValues[57][169] = "S3";

// Row 59 (index 58): Student 1
mockValues[58][0] = "1";
mockValues[58][1] = "Annie Sabrina S";
mockValues[58][2] = "MMT MSc";
mockValues[58][3] = "I";
mockValues[58][4] = "18";

let rangeValues = mockValues;
const mockSheet = {
  getName: () => "MMT",
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

// Evaluate the GAS code
eval(code);

// Run the test
const params = {
  sheetName: "MMT",
  date: "2026-09-03",
  session: "Session 3", // S3
  moduleTitle: "Language II",
  moduleTutor: "Tapan Kumar Roy",
  updates: [
    {
      rowIndex: 59,
      rollNo: "1",
      name: "Annie Sabrina S",
      batchYear: "MMT MSc - I",
      mark: "P"
    }
  ]
};

try {
  console.log("Running saveDepartmentAttendance...");
  const result = saveDepartmentAttendance(mockSheet, params);
  console.log("Result:", result);
} catch(e) {
  console.error("Error:", e);
}
