/**
 * ==========================================================================
 * AUTOATTENDANCE API CONNECTOR (Ultra-Precision Multi-Batch Grid Engine)
 * ==========================================================================
 */

function doGet(e) { 
  var output = handleAttendanceRequest(e, 'GET');

  if (e && e.parameter && (e.parameter.action === 'saveAttendance' || e.parameter.action === 'save')) {
    var resultText = output.success 
      ? ("Successfully marked attendance for " + (output.result ? output.result.updatedCount : "1") + " students in " + (e.parameter.sheetName || "Sheet") + " (" + (output.result ? output.result.columnLetter : "") + ")!")
      : ("Error: " + output.error);

    return HtmlService.createHtmlOutput(
      '<!DOCTYPE html>' +
      '<html><head><title>Attendance Synced</title><meta charset="utf-8"></head>' +
      '<body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;text-align:center;padding:40px 20px;background:#0f172a;color:#f8fafc;">' +
      '  <div style="max-width:440px;margin:0 auto;background:#1e293b;padding:25px;border-radius:16px;box-shadow:0 10px 25px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1);">' +
      '    <div style="font-size:44px;margin-bottom:10px;">' + (output.success ? '뿯½œ…' : '뿯½뿯½Œ') + '</div>' +
      '    <h2 style="margin:0 0 8px 0;color:' + (output.success ? '#10b981' : '#ef4444') + ';">' + (output.success ? 'Attendance Synced!' : 'Sync Failed') + '</h2>' +
      '    <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin-bottom:18px;">' + resultText + '</p>' +
      '    <button onclick="tryClose()" style="background:#6366f1;color:#fff;border:none;padding:8px 18px;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px;">Close Window</button>' +
      '  </div>' +
      '  <script>' +
      '    function tryClose() { try { window.top.close(); } catch(e){} try { window.close(); } catch(e){} }' +
      '    setTimeout(tryClose, 2000);' +
      '  </script>' +
      '</body></html>'
    );
  }

  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) { 
  var output = handleAttendanceRequest(e, 'POST'); 
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleAttendanceRequest(e, method) {
  var output = {};

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error("No active spreadsheet found.");

    var params = {};
    if (e && e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (pe) {
        params = e.parameter || {};
      }
    } else if (e && e.parameter) {
      if (e.parameter.postData) {
        try {
          params = JSON.parse(e.parameter.postData);
        } catch (pe2) {
          params = e.parameter;
        }
      } else {
        params = e.parameter;
      }
    }

    var action = params.action || (method === 'POST' ? 'saveAttendance' : 'getSheetData');

    var allSheets = ss.getSheets().map(function(s) { return s.getName(); });
    var deptSheets = allSheets.filter(function(name) {
      var lower = name.toLowerCase();
      return !lower.includes("helper") && 
             !lower.includes("summary") && 
             !lower.includes("dashboard") && 
             !lower.includes("report") && 
             !lower.includes("list") && 
             !lower.includes("absent") && 
             !lower.includes("consolidated") && 
             !lower.includes("contact");
    });

    if (action === 'test' || action === 'ping') {
      output = { 
        success: true, 
        message: "Connected successfully!", 
        spreadsheetTitle: ss.getName(),
        sheets: deptSheets.length > 0 ? deptSheets : allSheets
      };
    } else if (action === 'getSheets') {
      output = { success: true, sheets: deptSheets.length > 0 ? deptSheets : allSheets };
    } else if (action === 'getSheetData') {
      var sheetName = params.sheetName || (deptSheets.length > 0 ? deptSheets[0] : allSheets[0]);
      var sheet = ss.getSheetByName(sheetName) || ss.getSheets()[0];
      output = { 
        success: true, 
        sheetName: sheet.getName(), 
        sheets: deptSheets.length > 0 ? deptSheets : allSheets, 
        data: getDepartmentAttendanceData(sheet, params) 
      };
    } else if (action === 'saveAttendance' || action === 'save') {
      var targetSheetName = params.sheetName || (deptSheets.length > 0 ? deptSheets[0] : allSheets[0]);
      var targetSheet = ss.getSheetByName(targetSheetName) || ss.getSheets()[0];
      output = { 
        success: true, 
        message: "Attendance saved to Google Sheet!", 
        result: saveDepartmentAttendance(targetSheet, params) 
      };
    } else {
      throw new Error("Unknown action: " + action);
    }
  } catch (err) {
    output = { success: false, error: err.toString() };
  }

  return output;
}

function getDepartmentAttendanceData(sheet, params) {
  var values = sheet.getDataRange().getValues();
  if (!values || values.length === 0) return { students: [], sessions: [], batches: [] };

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
      id: "std_" + sheet.getName() + "_r" + (r + 1),
      rollNo: idVal || String(students.length + 1),
      name: nameVal,
      batchYear: combinedBatch,
      history: {}
    });
  }

  return {
    headerRow: 5,
    idCol: 'A',
    nameCol: 'B',
    students: students,
    sessions: [],
    batches: Object.keys(batchYears)
  };
}

function saveDepartmentAttendance(sheet, params) {
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

  // Normalize session code: Session 1 -> 0, Session 2 -> 1, Session 3 -> 2
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

    // Scan ALL header rows to find the exact column matching this specific Date or Day Name
    var dateColIdx = -1;
    var maxHeaderScan = Math.min(200, numRows); // Look deeper to support multiple sections/semesters

    for (var r = 0; r < maxHeaderScan; r++) {
      for (var c = 7; c < numCols; c++) {
        var cellVal = values[r][c];
        if (!cellVal) continue;

        var isMatch = false;
        if (cellVal instanceof Date) {
          // Date object comparison
          if (cellVal.getDate() === targetDay && (cellVal.getMonth() + 1) === targetMonth) {
            isMatch = true;
          }
        } else {
          // Text / String comparison (Strict matching to prevent wrong date collision)
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

    // Build row index map for students by name and batch
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
  var moduleTutor = params.moduleTutor || "";  // Dynamically find Title and Tutor rows by scanning Column B upwards
  var titleRowIdx = -1;
  var tutorRowIdx = -1;
  if (sessionRowIdx > 2) {
    for (var r = sessionRowIdx; r >= Math.max(1, sessionRowIdx - 4); r--) {
      var label = String(values[r - 1][1] || "").trim().toLowerCase(); // Column B is index 1
      if (label.indexOf("title") !== -1) titleRowIdx = r;
      if (label.indexOf("tutor") !== -1) tutorRowIdx = r;
    }
  }

  // Fallback to strict relative rows if labels not found
  if (titleRowIdx === -1 && sessionRowIdx > 2) titleRowIdx = sessionRowIdx - 2;
  if (tutorRowIdx === -1 && sessionRowIdx > 2) tutorRowIdx = sessionRowIdx - 1;

  if (moduleTitle && titleRowIdx > 0 && titleRowIdx !== sessionRowIdx) {
    // Only write if it doesn't overlap with the session row!
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
    // Prevent overwriting the Session row in broken sheets (like GDD)
    var tutorCell = sheet.getRange(tutorRowIdx, finalTargetCol);
    try {
        tutorCell.setValue(moduleTutor);
      } catch (e) {
        tutorCell.clearDataValidations();
        tutorCell.setValue(moduleTutor);
      }
    tutorCell.setHorizontalAlignment("center");
  }

  // Write attendance marks
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

function applyStatusColor(cell, mark) {
  var m = String(mark).toUpperCase();
  if (m === 'P') { cell.setBackground("#dcfce7").setFontColor("#166534"); }
  else if (m === 'A') { cell.setBackground("#fee2e2").setFontColor("#991b1b"); }
  else if (m === 'L') { cell.setBackground("#fef3c7").setFontColor("#92400e"); }
  else if (m === 'OD') { cell.setBackground("#ede9fe").setFontColor("#6d28d9"); }
}

function indexToColLetter(i) {
  var t = i + 1, l = '';
  while (t > 0) { var m = (t - 1) % 26; l = String.fromCharCode(65 + m) + l; t = Math.floor((t - m) / 26); }
  return l;
}
