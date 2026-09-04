const fs = require('fs');

const gddDump = JSON.parse(fs.readFileSync('gdd_dump.json', 'utf8').match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/)[1]);
const values = gddDump.table.rows.map(r => r.c.map(c => c ? (c.f || c.v || '') : ''));

// Simulate getDepartmentAttendanceData
var students = [];
var batchYears = {};
var currentDept = "General";
var currentBatch = "IV";
var combinedBatch = "General - IV";

for (var r = 0; r < values.length; r++) {
  var idVal = String(values[r][0] !== undefined && values[r][0] !== null ? values[r][0] : '').trim();
  var nameVal = String(values[r][1] !== undefined && values[r][1] !== null ? values[r][1] : '').trim();
  var deptVal = String(values[r][2] !== undefined && values[r][2] !== null ? values[r][2] : '').trim();
  var yearVal = String(values[r][3] !== undefined && values[r][3] !== null ? values[r][3] : '').trim();

  var deptUpdated = false;
  if (deptVal && deptVal.toLowerCase() !== 'dept' && deptVal.toLowerCase() !== 'department') {
    currentDept = deptVal;
    deptUpdated = true;
  }

  var yearUpdated = false;
  if (yearVal && yearVal.toLowerCase() !== 'year' && yearVal.toLowerCase() !== 'batch' && yearVal.toLowerCase() !== 'sem') {
    currentBatch = yearVal;
    yearUpdated = true;
  }
  
  if (deptUpdated || yearUpdated) {
    combinedBatch = currentDept + " - " + currentBatch;
    batchYears[combinedBatch] = true;
  }

  var lower = nameVal.toLowerCase();
  if (!nameVal || 
      lower === 'student name' || 
      lower === 'name' || 
      lower === 'names' || 
      lower === 'candidate name' ||
      lower.startsWith('module') || 
      lower.startsWith('faculty') ||
      lower.startsWith('department') ||
      lower.startsWith('total') ||
      lower.startsWith('tutor')) {
    continue;
  }

  if (nameVal.length < 2) continue;

  students.push({
    rowIndex: r + 1,
    name: nameVal,
    batchYear: combinedBatch
  });
}

console.log('Students around row 40-51:');
students.filter(s => s.rowIndex >= 40).forEach(s => {
  console.log(`Row ${s.rowIndex}: "${s.name}" (${s.batchYear})`);
});
