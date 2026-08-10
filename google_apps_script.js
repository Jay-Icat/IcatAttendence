/**
 * ==========================================================================
 * AUTOATTENDANCE API CONNECTOR (Ultra-Precision Multi-Batch Grid Engine)
 * ==========================================================================
 */

function doGet(e) { 
  var output = handleAttendanceRequest(e, 'GET');

  if (e && e.parameter && (e.parameter.action === 'saveAttendance' || e.parameter.action === 'save')) {
    var resultText = output.success 
      ? ("Successfully marked attendance for " + (output.result ? output.result.updatedCount : "1") + " students in " + (e.parameter.sheetName || "Sheet") + "!")
      : ("Error: " + output.error);

    return HtmlService.createHtmlOutput(
      '<!DOCTYPE html>' +
      '<html><head><title>Attendance Synced</title><meta charset="utf-8"></head>' +
      '<body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;text-align:center;padding:50px 20px;background:#0f172a;color:#f8fafc;">' +
      '  <div style="max-width:480px;margin:0 auto;background:#1e293b;padding:30px;border-radius:16px;box-shadow:0 10px 25px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1);">' +
      '    <div style="font-size:48px;margin-bottom:12px;">' + (output.success ? '✅' : '❌') + '</div>' +
      '    <h2 style="margin:0 0 10px 0;color:' + (output.success ? '#10b981' : '#ef4444') + ';">' + (output.success ? 'Attendance Synced!' : 'Sync Failed') + '</h2>' +
      '    <p style="color:#94a3b8;font-size:14px;line-height:1.5;">' + resultText + '</p>' +
      '    <p style="color:#64748b;font-size:12px;margin-top:20px;">Closing window in 2 seconds...</p>' +
      '  </div>' +
      '  <script>' +
      '    setTimeout(function() { try { window.close(); } catch(e){} }, 2200);' +
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
  var currentBatch = "IV";

  for (var r = 0; r < values.length; r++) {
    var idVal = String(values[r][0] !== undefined && values[r][0] !== null ? values[r][0] : '').trim();
    var nameVal = String(values[r][1] !== undefined && values[r][1] !== null ? values[r][1] : '').trim();
    var yearVal = String(values[r][3] !== undefined && values[r][3] !== null ? values[r][3] : '').trim();

    if (yearVal && yearVal.toLowerCase() !== 'year' && yearVal.toLowerCase() !== 'batch') {
      currentBatch = yearVal;
      batchYears[currentBatch] = true;
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
      batchYear: currentBatch,
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
  var dateStr = params.date || ""; // e.g. "2026-08-10"
  var sessionName = params.session || ""; // e.g. "Session 2 (11:15 AM - 01:00 PM)"
  var updates = [];

  // Parse updates array or single params
  if (params.updates) {
    if (typeof params.updates === 'string') {
      try { updates = JSON.parse(params.updates); } catch(e){}
    } else {
      updates = params.updates;
    }
  }

  if (updates.length === 0 && params.row && params.mark) {
    updates = [{ rowIndex: parseInt(params.row, 10), name: params.name || '', mark: params.mark }];
  }

  var values = sheet.getDataRange().getValues();
  var numRows = values.length;
  var numCols = sheet.getLastColumn();

  // Normalize session: S1 -> 0, S2 -> 1, S3 -> 2
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

  // Parse target date (e.g. 2026-08-10 -> 8/10/2026)
  var targetDay = 10, targetMonth = 8, targetYear = 2026;
  if (dateStr) {
    var parts = dateStr.split('-');
    if (parts.length === 3) {
      targetYear = parseInt(parts[0], 10);
      targetMonth = parseInt(parts[1], 10);
      targetDay = parseInt(parts[2], 10);
    }
  }

  // Find Date Column across all header rows in the sheet
  var dateColIdx = -1;

  for (var r = 0; r < Math.min(30, numRows); r++) {
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
        if (str.includes(targetMonth + '/' + targetDay) || 
            str.includes(targetDay + '/' + targetMonth) || 
            str.includes(dateStr) || 
            str.includes('8/10/2026') || 
            str.includes('10/8/2026')) {
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

  // Determine final target column
  var finalTargetCol = -1;
  if (dateColIdx !== -1) {
    finalTargetCol = dateColIdx + sessionOffset + 1; // 1-indexed
  } else {
    for (var c = 7; c < numCols; c++) {
      for (var r = 0; r < Math.min(30, numRows); r++) {
        var h = String(values[r][c] || '').trim().toUpperCase();
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

  // Apply updates to exact student rows
  var updatedCount = 0;

  for (var u = 0; u < updates.length; u++) {
    var item = updates[u];
    var rowNum = item.rowIndex;

    if (!rowNum || rowNum < 5) {
      if (item.name) {
        var cleanTargetName = item.name.toLowerCase().trim();
        for (var r = 0; r < numRows; r++) {
          var rowName = String(values[r][1] || '').toLowerCase().trim();
          if (rowName === cleanTargetName) {
            rowNum = r + 1;
            break;
          }
        }
      }
    }

    if (rowNum && item.mark) {
      var cell = sheet.getRange(rowNum, finalTargetCol);
      cell.setValue(item.mark);
      cell.setHorizontalAlignment("center");
      applyStatusColor(cell, item.mark);
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
