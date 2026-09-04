const fs = require('fs');

const replacement = `// Build row index map for students by name and batch
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
  
    // Resolve target rows for all updates FIRST so we know exactly which table/batch we are in
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

    // Determine sessionRowIdx by scanning upwards from minUpdateRow
    var sessionRowIdx = -1;
    var startScanIdx = (minUpdateRow !== -1) ? (minUpdateRow - 2) : Math.min(30, numRows - 1); 
    
    for (var i = startScanIdx; i >= Math.max(0, startScanIdx - 10); i--) {
        var foundAnySession = false;
        for (var c = 7; c < Math.min(numCols, 50); c++) {
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
        sessionRowIdx = (minUpdateRow !== -1) ? (minUpdateRow - 1) : 5; 
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

    // Scan ONLY the header rows specifically above this batch's session row for the Date
    var dateColIdx = -1;
    var scanStartRow = Math.max(0, sessionRowIdx - 6);
    var scanEndRow = sessionRowIdx - 1; // Don't scan the session row itself
    
    for (var r = scanStartRow; r < scanEndRow; r++) {
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
            isMatch = true;
          }
        }
  
        if (isMatch) {
          dateColIdx = c;
          break;
        }
      }
      if (dateColIdx !== -1) break;
    }

    // Determine final target column by scanning horizontally in the sessionRowIdx
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
  
    if (finalTargetCol === -1) {
      throw new Error("Could not find column for Date " + dateStr + " and " + sessionCode + " around row " + sessionRowIdx);
    }
`;

function doReplace(file) {
    let content = fs.readFileSync(file, 'utf8');
    const startStr = '// Parse target date components';
    const endStr = 'if (finalTargetCol === -1) {\n      throw new Error("Could not find column for Date " + dateStr + " and " + sessionCode);\n    }';
    
    let startIndex = content.indexOf(startStr);
    let endIndex = content.indexOf(endStr);
    
    if (startIndex !== -1 && endIndex !== -1) {
        let before = content.substring(0, startIndex);
        let after = content.substring(endIndex + endStr.length);
        fs.writeFileSync(file, before + replacement + after, 'utf8');
        console.log('Replaced in', file);
    } else {
        console.log('Could not find start/end in', file);
    }
}

['AutoAttendanceAPI.gs', 'google_apps_script.js', 'GAS_CODE_TO_COPY_V3.js', 'GAS_CODE_TO_COPY.js'].forEach(doReplace);
