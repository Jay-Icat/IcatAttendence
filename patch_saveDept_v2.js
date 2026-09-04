const fs = require('fs');

const replacement = `function saveDepartmentAttendance(sheet, params) {
  var dateStr = params.date || ""; // e.g. "2026-08-11"
  var sessionName = params.session || ""; // e.g. "Session 1 (09:15 AM - 11:00 AM)"
  var updates = [];

  if (params.updates) {
    if (typeof params.updates === 'string') {
      try { updates = JSON.parse(params.updates); } catch(e){}
    } else {
      updates = params.updates;
    }
  }

  var values = sheet.getDataRange().getValues();
  var numRows = values.length;
  var numCols = sheet.getLastColumn();

  var sessionOffset = 0;
  var sessionCode = "S1";
  var sLower = sessionName.toLowerCase();
  if (sLower.includes('session 2') || sLower.includes('11:15') || sLower === 's2' || sLower === '2') {
    sessionOffset = 1;
    sessionCode = "S2";
  } else if (sLower.includes('session 3') || sLower.includes('02:00') || sLower.includes('2pm') || sLower === 's3' || sLower === '3') {
    sessionOffset = 2;
    sessionCode = "S3";
  }

  // Parse target date components
  var targetDay = 11, targetMonth = 8, targetYear = 2026;
  var targetDayName = "";
  if (dateStr) {
    var parts = dateStr.split('-');
    if (parts.length === 3) {
      targetYear = parseInt(parts[0], 10);
      targetMonth = parseInt(parts[1], 10);
      targetDay = parseInt(parts[2], 10);
      var d = new Date(targetYear, targetMonth - 1, targetDay);
      var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      targetDayName = days[d.getDay()];
    }
  }

  // 1. Find dateColIdx by scanning globally from the top.
  // Because columns are vertically aligned, finding the date ANYWHERE in the first 50 rows guarantees the correct column base.
  var dateColIdx = -1;
  for (var r = 0; r < Math.min(50, numRows); r++) {
    for (var c = 7; c < numCols; c++) {
      var cellVal = values[r][c];
      if (!cellVal) continue;

      var isMatch = false;
      if (cellVal instanceof Date) {
        if (cellVal.getDate() === targetDay && (cellVal.getMonth() + 1) === targetMonth) {
          isMatch = true;
        }
      } else {
        var str = String(cellVal).trim();
        var m_d_y = targetMonth + '/' + targetDay + '/' + targetYear;
        var d_m_y = targetDay + '/' + targetMonth + '/' + targetYear;
        var m_d = targetMonth + '/' + targetDay;
        var d_m = targetDay + '/' + targetMonth;

        if (str === m_d_y || str === d_m_y || str === m_d || str === d_m || str === dateStr ||
            str.indexOf(m_d_y) !== -1 || str.indexOf(d_m_y) !== -1 || str.indexOf(dateStr) !== -1) {
          isMatch = true;
        } else if (targetDayName && str.toLowerCase() === targetDayName.toLowerCase()) {
          // Only fallback to day name if it's explicitly matched
          isMatch = true;
        }
      }

      if (isMatch) {
        dateColIdx = c;
        break;
      }
    }
    // If we matched the exact date, we can stop globally. If we only matched "Friday", 
    // we might want to keep scanning to see if the EXACT date exists elsewhere.
    // To be safe, let's just break on first match (which is how it originally worked, 
    // but now we rely on vertical alignment).
    if (dateColIdx !== -1) break;
  }

  // 2. Build row index map for students by name and batch
  var studentRowMap = {};
  var currentDept = "General";
  var currentBatch = "IV";
  for (var r = 0; r < numRows; r++) {
    var deptVal = String(values[r][2] || "").trim();
    if (deptVal && deptVal.toLowerCase() !== "dept" && deptVal.toLowerCase() !== "department") {
      currentDept = deptVal;
    }

    var yearVal = String(values[r][3] || "").trim();
    if (yearVal && yearVal.toLowerCase() !== "year" && yearVal.toLowerCase() !== "batch" && yearVal.toLowerCase() !== "sem") {
      currentBatch = yearVal;
    }

    var rowName = String(values[r][1] || "").trim().toLowerCase();
    if (rowName && rowName !== "student name" && rowName !== "name") {
      var combinedBatch = currentDept + " - " + currentBatch;
      studentRowMap[rowName + "_" + combinedBatch.toLowerCase()] = r + 1;
      studentRowMap[rowName + "_" + currentBatch.toLowerCase()] = r + 1;
      studentRowMap[rowName] = r + 1;
    }
  }

  // 3. Resolve target rows for all updates
  var minUpdateRow = -1;
  var resolvedUpdates = [];
  
  for (var u = 0; u < updates.length; u++) {
    var item = updates[u];
    var rowNum = item.rowIndex;

    if (item.name) {
      var cleanName = item.name.trim().toLowerCase();
      var batchKey = item.batchYear ? (cleanName + "_" + String(item.batchYear).trim().toLowerCase()) : cleanName;
      if (studentRowMap[batchKey]) {
        rowNum = studentRowMap[batchKey];
      } else if (studentRowMap[cleanName]) {
        rowNum = studentRowMap[cleanName];
      }
    }

    if (rowNum) {
      rowNum = parseInt(rowNum, 10);
      resolvedUpdates.push({ rowNum: rowNum, mark: item.mark });
      if (minUpdateRow === -1 || rowNum < minUpdateRow) {
        minUpdateRow = rowNum;
      }
    }
  }

  // 4. Determine sessionRowIdx by scanning upwards from first student (minUpdateRow)
  var sessionRowIdx = -1;
  var startScanIdx = (minUpdateRow !== -1) ? (minUpdateRow - 2) : Math.min(30, numRows - 1); 
  
  // Scan horizontally across rows UPWARDS from the first student to find the nearest S1/S2/S3 header row
  for (var i = startScanIdx; i >= Math.max(0, startScanIdx - 15); i--) {
    var foundAnySession = false;
    for (var c = 7; c < Math.min(numCols, 200); c++) {
      var h = String(values[i][c] || "").trim().toUpperCase();
      if (h === "S1" || h === "S2" || h === "S3") {
        foundAnySession = true;
        break;
      }
    }
    if (foundAnySession) {
      sessionRowIdx = i + 1; // 1-indexed
      break;
    }
  }

  if (sessionRowIdx === -1) {
    sessionRowIdx = (minUpdateRow !== -1) ? (minUpdateRow - 1) : 5; // fallback
  }

  // 5. Determine final target column by scanning horizontally in the sessionRowIdx starting near dateColIdx
  var finalTargetCol = -1;
  if (sessionRowIdx !== -1) {
    var startCol = (dateColIdx !== -1) ? dateColIdx : 7;
    var endCol = (dateColIdx !== -1) ? Math.min(numCols, dateColIdx + 8) : numCols;
    
    for (var c = startCol; c < endCol; c++) {
      var h = String(values[sessionRowIdx - 1][c] || "").trim().toUpperCase();
      if (h === sessionCode) {
        finalTargetCol = c + 1; // 1-indexed
        break;
      }
    }
  }

  // Legacy Fallback if finalTargetCol is STILL not found
  if (finalTargetCol === -1) {
    for (var c = 7; c < numCols; c++) {
      for (var r = Math.max(0, sessionRowIdx - 2); r <= sessionRowIdx; r++) {
        var h = String(values[r][c] || "").trim().toUpperCase();
        if (h === sessionCode) {
          finalTargetCol = c + 1;
          break;
        }
      }
      if (finalTargetCol !== -1) break;
    }
  }

  if (finalTargetCol === -1) {
    throw new Error("Could not find column for Date " + dateStr + " and " + sessionCode);
  }

  var moduleTitle = params.moduleTitle || "";
  var moduleTutor = params.moduleTutor || "";  
  
  // 6. Dynamically find Title and Tutor rows by scanning Column B upwards
  var titleRowIdx = -1;
  var tutorRowIdx = -1;
  if (sessionRowIdx > 2) {
    for (var r = sessionRowIdx; r >= Math.max(1, sessionRowIdx - 4); r--) {
      var label = String(values[r - 1][1] || "").trim().toLowerCase(); 
      if (label.indexOf("title") !== -1) titleRowIdx = r;
      if (label.indexOf("tutor") !== -1) tutorRowIdx = r;
    }
  }

  if (titleRowIdx === -1 && sessionRowIdx > 2) titleRowIdx = sessionRowIdx - 2;
  if (tutorRowIdx === -1 && sessionRowIdx > 2) tutorRowIdx = sessionRowIdx - 1;

  if (moduleTitle && titleRowIdx > 0 && titleRowIdx !== sessionRowIdx) {
    var titleCell = sheet.getRange(titleRowIdx, finalTargetCol);
    try {
      titleCell.setValue(moduleTitle);
    } catch (e) {
      titleCell.clearDataValidations();
      titleCell.setValue(moduleTitle);
    }
    titleCell.setHorizontalAlignment("center");
  }

  if (moduleTutor && tutorRowIdx > 0 && tutorRowIdx !== sessionRowIdx) {
    var tutorCell = sheet.getRange(tutorRowIdx, finalTargetCol);
    try {
      tutorCell.setValue(moduleTutor);
    } catch (e) {
      tutorCell.clearDataValidations();
      tutorCell.setValue(moduleTutor);
    }
    tutorCell.setHorizontalAlignment("center");
  }

  // 7. Write attendance marks
  var updatedCount = 0;
  for (var ru = 0; ru < resolvedUpdates.length; ru++) {
    var rData = resolvedUpdates[ru];
    if (rData.mark) {
      var cell = sheet.getRange(rData.rowNum, finalTargetCol);
      try {
        cell.setValue(rData.mark);
      } catch (e) {
        cell.clearDataValidations();
        cell.setValue(rData.mark);
      }
      cell.setHorizontalAlignment("center");
      applyStatusColor(cell, rData.mark);
      updatedCount++;
    }
  }

  return {
    targetColumn: finalTargetCol,
    columnLetter: indexToColLetter(finalTargetCol - 1),
    session: sessionCode,
    updatedCount: updatedCount
  };
}
`;

let content = fs.readFileSync('AutoAttendanceAPI.gs', 'utf8');

let matchStart = content.indexOf('function saveDepartmentAttendance(');
let matchEnd = content.indexOf('function applyStatusColor(');

if (matchStart !== -1 && matchEnd !== -1) {
    let before = content.substring(0, matchStart);
    let after = content.substring(matchEnd);
    fs.writeFileSync('AutoAttendanceAPI.gs', before + replacement + after, 'utf8');
    fs.writeFileSync('GAS_CODE_TO_COPY_V3.js', before + replacement + after, 'utf8');
    fs.writeFileSync('GAS_CODE_TO_COPY.js', before + replacement + after, 'utf8');
    fs.writeFileSync('google_apps_script.js', before + replacement + after, 'utf8');
    console.log("Successfully completely rewrote saveDepartmentAttendance");
} else {
    console.log("Failed to find bounds.");
}
