const fs = require("fs");

const replacement = `  // Build row index map for students by name and batch
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
      
      // Map name + full combined batch
      studentRowMap[rowName + "_" + combinedBatch.toLowerCase()] = r + 1;
      // Also map name + just batch as fallback
      studentRowMap[rowName + "_" + currentBatch.toLowerCase()] = r + 1;
      // Map name alone
      studentRowMap[rowName] = r + 1;
    }
  }

  // Resolve target rows for all updates
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

  // Determine sessionRowIdx by scanning upwards from first student in the date column
  var sessionRowIdx = -1;
  var startScanIdx = (minUpdateRow !== -1) ? (minUpdateRow - 2) : Math.min(30, numRows - 1); 
  
  if (dateColIdx !== -1) {
    for (var i = startScanIdx; i >= 0; i--) {
      var cellValue = String(values[i][dateColIdx] || "").trim().toUpperCase();
      if (cellValue === "S1" || cellValue === "S2" || cellValue === "S3") {
        sessionRowIdx = i + 1; // 1-indexed
        break;
      }
    }
  }

  // If upward scan failed, fallback to scanning horizontally across the row to find any session
  if (sessionRowIdx === -1) {
    for (var i = startScanIdx; i >= 0; i--) {
      var foundAnySession = false;
      for (var c = 7; c < Math.min(numCols, 50); c++) {
        var h = String(values[i][c] || "").trim().toUpperCase();
        if (h === "S1" || h === "S2" || h === "S3") {
          foundAnySession = true;
          break;
        }
      }
      if (foundAnySession) {
        sessionRowIdx = i + 1;
        break;
      }
    }
  }

  // Determine final target column by scanning horizontally in the sessionRowIdx
  var finalTargetCol = -1;
  if (sessionRowIdx !== -1) {
    // If we have dateColIdx, start scanning from there up to dateColIdx+6
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
      for (var r = 0; r < Math.min(200, numRows); r++) {
        var h = String(values[r][c] || "").trim().toUpperCase();
        if (h === sessionCode) {
          finalTargetCol = c + 1;
          if (sessionRowIdx === -1) sessionRowIdx = r + 1;
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
  var moduleTutor = params.moduleTutor || "";`;

function replaceInFile(file, encoding) {
  try {
    if (!fs.existsSync(file)) return;
    let text = fs.readFileSync(file, encoding);
    
    const startStr = "  // Determine final target column";
    const endStr = "  // Write Title and Tutor to the cells directly above the anchor";
    
    const startIdx = text.indexOf(startStr);
    const endIdx = text.indexOf(endStr);
    
    if (startIdx !== -1 && endIdx !== -1) {
      text = text.substring(0, startIdx) + replacement + "\n\n" + text.substring(endIdx);
      fs.writeFileSync(file, text, encoding);
      console.log("Updated " + file);
    } else {
      console.log("Could not find boundaries in " + file);
    }
  } catch(e) {
    console.error(e);
  }
}

replaceInFile("google_apps_script.js", "utf8");
replaceInFile("GAS_CODE_TO_COPY_V3.js", "utf16le");
replaceInFile("GAS_CODE_TO_COPY.js", "utf16le");
