/**
 * ==========================================================================
 * AUTOATTENDANCE API CONNECTOR (Ultra-Precision Multi-Batch Indexing Engine)
 * Version: 4.2.0-smart-indexer
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
      '    <div style="font-size:44px;margin-bottom:10px;">' + (output.success ? '✅' : '❌') + '</div>' +
      '    <h2 style="margin:0 0 8px 0;color:' + (output.success ? '#10b981' : '#ef4444') + ';">' + (output.success ? 'Attendance Synced!' : 'Sync Failed') + '</h2>' +
      '    <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin-bottom:18px;">' + resultText + '</p>' +
      '    <button onclick="tryClose()" style="background:#6366f1;color:#fff;border:none;padding:8px 18px;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px;">Close Window</button>' +
      '  </div>' +
      '  <script>' +
      '    function tryClose() { try { window.top.close(); } catch(e){} try { window.close(); } catch(e){} }' +
      '    setTimeout(tryClose, 2500);' +
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
        version: "4.2.0-smart-indexer",
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

/**
 * Builds a complete structural index of the spreadsheet tab:
 * - dateColumns: exact column where each date begins
 * - blocks: all batch tables, their title rows, tutor rows, session rows, and student rows
 */
function buildSheetIndex(values) {
  var numRows = values.length;
  var numCols = values[0].length;

  var dateColumns = {};
  for (var r = 0; r < Math.min(35, numRows); r++) {
    for (var c = 7; c < numCols; c++) {
      var cell = values[r][c];
      if (!cell) continue;

      var isoDate = '';
      if (cell instanceof Date) {
        var y = cell.getFullYear();
        var m = cell.getMonth() + 1;
        var d = cell.getDate();
        isoDate = y + '-' + (m < 10 ? '0' + m : m) + '-' + (d < 10 ? '0' + d : d);
      } else {
        var str = String(cell).trim();
        var dateParts = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (dateParts) {
          var p1 = parseInt(dateParts[1], 10);
          var p2 = parseInt(dateParts[2], 10);
          var yr = parseInt(dateParts[3], 10);
          var mo = p1, dy = p2;
          if (p1 > 12) { dy = p1; mo = p2; }
          isoDate = yr + '-' + (mo < 10 ? '0' + mo : mo) + '-' + (dy < 10 ? '0' + dy : dy);
        } else if (str.match(/^\d{4}-\d{2}-\d{2}$/)) {
          isoDate = str;
        }
      }

      if (isoDate && !dateColumns[isoDate]) {
        dateColumns[isoDate] = c + 1; // 1-indexed
      }
    }
  }

  var blocks = [];
  var currentDept = "General";
  var currentBatch = "IV";

  for (var r = 0; r < numRows; r++) {
    var colC = String(values[r][2] || '').trim();
    var colD = String(values[r][3] || '').trim();

    if (colC && colC.toLowerCase() !== 'dept' && colC.toLowerCase() !== 'department') currentDept = colC;
    if (colD && colD.toLowerCase() !== 'year' && colD.toLowerCase() !== 'batch' && colD.toLowerCase() !== 'sem') currentBatch = colD;

    var isSessionRow = false;
    for (var c = 7; c < Math.min(numCols, 60); c++) {
      var h = String(values[r][c] || '').trim().toUpperCase();
      if (h === 'S1' || h === 'S2' || h === 'S3') {
        isSessionRow = true;
        break;
      }
    }

    if (isSessionRow) {
      var sessionRow = r + 1;
      var titleRow = -1;
      var tutorRow = -1;
      for (var checkR = r - 1; checkR >= Math.max(0, r - 4); checkR--) {
        var label = String(values[checkR][1] || '').trim().toLowerCase();
        if (label.indexOf('title') !== -1) titleRow = checkR + 1;
        if (label.indexOf('tutor') !== -1) tutorRow = checkR + 1;
      }
      if (titleRow === -1 && sessionRow > 2) titleRow = sessionRow - 2;
      if (tutorRow === -1 && sessionRow > 2) tutorRow = sessionRow - 1;

      var students = [];
      for (var sR = r + 1; sR < numRows; sR++) {
        var sName = String(values[sR][1] || '').trim();
        var sDept = String(values[sR][2] || '').trim();
        var sYear = String(values[sR][3] || '').trim();
        var sLower = sName.toLowerCase();

        if (sDept && sDept.toLowerCase() !== 'dept' && sDept.toLowerCase() !== 'department') currentDept = sDept;
        if (sYear && sYear.toLowerCase() !== 'year' && sYear.toLowerCase() !== 'batch') currentBatch = sYear;

        if (!sName || sLower === 'student name' || sLower.indexOf('module') !== -1 || sLower.indexOf('tutor') !== -1) break;
        if (sName.length >= 2) {
          students.push({
            row: sR + 1,
            name: sName,
            batchKey: currentDept + " - " + currentBatch
          });
        }
      }

      if (students.length > 0) {
        blocks.push({
          batchKey: students[0].batchKey,
          titleRow: titleRow,
          tutorRow: tutorRow,
          sessionRow: sessionRow,
          students: students
        });
      }
    }
  }

  return { dateColumns: dateColumns, blocks: blocks };
}

/**
 * Safely writes a cell value, ensuring strict data validations never throw fatal exceptions
 */
function safeSetCellValue(cell, value) {
  if (!cell || value === undefined || value === null || value === '') return;
  try {
    cell.clearDataValidations();
    cell.setDataValidation(null);
  } catch (e) {}

  try {
    cell.setValue(value);
  } catch (e) {
    try {
      SpreadsheetApp.flush();
      cell.clear({ validationsOnly: true });
      cell.setValue(value);
    } catch (e2) {
      Logger.log("Failed to set cell value: " + e2.toString());
    }
  }
}

function saveDepartmentAttendance(sheet, params) {
  var dateStr = params.date || ""; // e.g. "2026-09-04"
  var sessionName = params.session || "";
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

  var sessionCode = "S1";
  var sLower = sessionName.toLowerCase();
  if (sLower.indexOf('session 2') !== -1 || sLower.indexOf('11:15') !== -1 || sLower === 's2' || sLower === '2') {
    sessionCode = "S2";
  } else if (sLower.indexOf('session 3') !== -1 || sLower.indexOf('02:00') !== -1 || sLower.indexOf('2pm') !== -1 || sLower === 's3' || sLower === '3') {
    sessionCode = "S3";
  }

  // 1. Build the complete Sheet Structure Index
  var index = buildSheetIndex(values);
  var baseCol = index.dateColumns[dateStr];

  // If exact date string was not in index, fallback to scanning horizontally for date components
  if (!baseCol && dateStr) {
    var parts = dateStr.split('-');
    if (parts.length === 3) {
      var tY = parseInt(parts[0], 10);
      var tM = parseInt(parts[1], 10);
      var tD = parseInt(parts[2], 10);
      for (var r = 0; r < Math.min(30, numRows); r++) {
        for (var c = 7; c < numCols; c++) {
          var cellVal = values[r][c];
          if (!cellVal) continue;
          if (cellVal instanceof Date) {
            if (cellVal.getDate() === tD && (cellVal.getMonth() + 1) === tM) {
              baseCol = c + 1;
              break;
            }
          }
        }
        if (baseCol) break;
      }
    }
  }

  if (!baseCol) {
    throw new Error("Could not find column for Date " + dateStr + " in sheet " + sheet.getName());
  }

  // 2. Identify target batch block
  var matchedBlock = null;
  if (updates.length > 0) {
    var first = updates[0];
    if (first.rowIndex) {
      for (var b = 0; b < index.blocks.length; b++) {
        var blk = index.blocks[b];
        for (var st = 0; st < blk.students.length; st++) {
          if (blk.students[st].row === first.rowIndex) {
            matchedBlock = blk;
            break;
          }
        }
        if (matchedBlock) break;
      }
    }
    if (!matchedBlock && first.batchYear) {
      var searchKey = String(first.batchYear).trim().toLowerCase();
      for (var b = 0; b < index.blocks.length; b++) {
        if (index.blocks[b].batchKey.toLowerCase() === searchKey) {
          matchedBlock = index.blocks[b];
          break;
        }
      }
    }
    if (!matchedBlock && first.name) {
      var searchName = String(first.name).trim().toLowerCase();
      for (var b = 0; b < index.blocks.length; b++) {
        var blk = index.blocks[b];
        for (var st = 0; st < blk.students.length; st++) {
          if (blk.students[st].name.toLowerCase() === searchName) {
            matchedBlock = blk;
            break;
          }
        }
        if (matchedBlock) break;
      }
    }
  }

  if (!matchedBlock) {
    matchedBlock = index.blocks.length > 0 ? index.blocks[0] : {
      titleRow: 3,
      tutorRow: 4,
      sessionRow: 5,
      students: []
    };
  }

  // 3. Find exact target column for this session within the matched block
  var finalTargetCol = -1;
  var sessionRowValues = values[matchedBlock.sessionRow - 1];

  // Scan from baseCol rightwards up to baseCol + 4
  for (var c = baseCol; c <= Math.min(numCols, baseCol + 4); c++) {
    var h = String(sessionRowValues[c - 1] || '').trim().toUpperCase();
    if (h === sessionCode) {
      finalTargetCol = c;
      break;
    }
  }

  if (finalTargetCol === -1) {
    // Fallback: search within baseCol to baseCol + 8
    for (var c = baseCol; c <= Math.min(numCols, baseCol + 8); c++) {
      var h = String(sessionRowValues[c - 1] || '').trim().toUpperCase();
      if (h === sessionCode) {
        finalTargetCol = c;
        break;
      }
    }
  }

  if (finalTargetCol === -1) {
    finalTargetCol = baseCol; // Safe default
  }

  // 4. Write Module Title and Tutor into the matched block
  var moduleTitle = params.moduleTitle || "";
  var moduleTutor = params.moduleTutor || "";

  if (moduleTitle && matchedBlock.titleRow > 0 && matchedBlock.titleRow !== matchedBlock.sessionRow) {
    var titleCell = sheet.getRange(matchedBlock.titleRow, finalTargetCol);
    safeSetCellValue(titleCell, moduleTitle);
    titleCell.setHorizontalAlignment("center");
  }

  if (moduleTutor && matchedBlock.tutorRow > 0 && matchedBlock.tutorRow !== matchedBlock.sessionRow) {
    var tutorCell = sheet.getRange(matchedBlock.tutorRow, finalTargetCol);
    safeSetCellValue(tutorCell, moduleTutor);
    tutorCell.setHorizontalAlignment("center");
  }

  // 5. Write attendance marks for each student
  var updatedCount = 0;
  for (var ru = 0; ru < updates.length; ru++) {
    var item = updates[ru];
    if (item.mark) {
      var targetRow = item.rowIndex;
      // If rowIndex was not directly provided, find from block students index
      if (!targetRow && item.name) {
        var cleanN = String(item.name).trim().toLowerCase();
        for (var s = 0; s < matchedBlock.students.length; s++) {
          if (matchedBlock.students[s].name.toLowerCase() === cleanN) {
            targetRow = matchedBlock.students[s].row;
            break;
          }
        }
      }

      if (targetRow) {
        var cell = sheet.getRange(targetRow, finalTargetCol);
        safeSetCellValue(cell, item.mark);
        cell.setHorizontalAlignment("center");
        applyStatusColor(cell, item.mark);
        updatedCount++;
      }
    }
  }

  return {
    targetColumn: finalTargetCol,
    columnLetter: indexToColLetter(finalTargetCol - 1),
    session: sessionCode,
    updatedCount: updatedCount,
    batchKey: matchedBlock.batchKey
  };
}

function applyStatusColor(cell, mark) {
  var m = String(mark).toUpperCase();
  try {
    if (m === 'P') { cell.setBackground("#dcfce7").setFontColor("#166534"); }
    else if (m === 'A') { cell.setBackground("#fee2e2").setFontColor("#991b1b"); }
    else if (m === 'L') { cell.setBackground("#fef3c7").setFontColor("#92400e"); }
    else if (m === 'OD') { cell.setBackground("#ede9fe").setFontColor("#6d28d9"); }
  } catch (e) {}
}

function indexToColLetter(i) {
  var t = i + 1, l = '';
  while (t > 0) { var m = (t - 1) % 26; l = String.fromCharCode(65 + m) + l; t = Math.floor((t - m) / 26); }
  return l;
}
