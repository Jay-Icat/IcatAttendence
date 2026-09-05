/**
 * ==========================================================================
 * AUTOATTENDANCE API CONNECTOR (Ultra-Precision Multi-Batch Indexing Engine)
 * Version: 4.4.0-bulletproof-anim-all-batches
 * ==========================================================================
 */

function doGet(e) { 
  var output = handleAttendanceRequest(e, 'GET');

  if (e && e.parameter && (e.parameter.action === 'saveAttendance' || e.parameter.action === 'save')) {
    var resultText = output.success 
      ? ("Successfully marked attendance for " + (output.result ? output.result.updatedCount : "1") + " students in " + (e.parameter.sheetName || "Sheet") + " (" + (output.result ? (output.result.batchKey + " - " + output.result.columnLetter) : "") + ")!")
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
        version: "4.4.0-bulletproof-anim-all-batches",
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
    } else if (action === 'healHeaders') {
      var targetSheetName = params.sheetName || (deptSheets.length > 0 ? deptSheets[0] : allSheets[0]);
      var targetSheet = ss.getSheetByName(targetSheetName) || ss.getSheets()[0];
      output = {
        success: true,
        message: "Headers healed successfully!",
        result: healSheetHeaders(targetSheet, params)
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
        lower.indexOf('module') !== -1 || 
        lower.indexOf('faculty') !== -1 || 
        lower.indexOf('department') !== -1 ||
        lower.indexOf('total') !== -1 ||
        lower.indexOf('tutor') !== -1 ||
        lower.indexOf('batch') !== -1 ||
        lower.indexOf('attendance') !== -1 ||
        lower === 'sl' || lower === 's.no' || lower === 'sl.no') {
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
 * Normalizes a string for robust batch matching
 */
function cleanBatchStr(str) {
  if (!str) return "";
  return String(str).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

/**
 * Normalizes a student name for robust matching (ignoring punctuation, spaces, case)
 */
function normalizeName(name) {
  if (!name) return "";
  return String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Builds an ultra-precise, student-driven index of the spreadsheet:
 * 1. Discovers every student and maps their true 1-indexed sheet row and batch.
 * 2. Groups students into distinct batch blocks with strict boundaries [firstRow, lastRow].
 * 3. Identifies the exact SessionRow, TutorRow, and TitleRow for each block.
 * 4. Maps all date columns (e.g. 2026-09-04, 2026-09-07) across all date header rows.
 */
function buildSheetIndex(values) {
  var numRows = values.length;
  var numCols = values[0] ? values[0].length : 0;

  // 1. Date Columns Map (Scan rows 1 to 80 for date headers)
  var dateColumns = {};
  for (var r = 0; r < Math.min(80, numRows); r++) {
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
        dateColumns[isoDate] = c + 1; // 1-indexed column
      }
    }
  }

  // 2. Discover all students with exact 1-indexed sheet row numbers
  var allStudents = [];
  var currentDept = "General";
  var currentBatch = "IV";
  var combinedBatch = "General - IV";

  for (var r = 0; r < numRows; r++) {
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
    }

    var lower = nameVal.toLowerCase();
    if (!nameVal || 
        lower === 'student name' || 
        lower === 'name' || 
        lower === 'names' || 
        lower === 'candidate name' ||
        lower.indexOf('module') !== -1 || 
        lower.indexOf('faculty') !== -1 || 
        lower.indexOf('department') !== -1 ||
        lower.indexOf('total') !== -1 ||
        lower.indexOf('tutor') !== -1 ||
        lower.indexOf('batch') !== -1 ||
        lower.indexOf('attendance') !== -1 ||
        lower === 'sl' || lower === 's.no' || lower === 'sl.no') {
      continue;
    }

    if (nameVal.length < 2) continue;

    allStudents.push({
      row: r + 1, // 1-indexed true sheet row
      rollNo: idVal || String(allStudents.length + 1),
      name: nameVal,
      batchKey: combinedBatch
    });
  }

  // 3. Group contiguous students into Batch Blocks
  var blocks = [];
  var currentBlock = null;

  for (var i = 0; i < allStudents.length; i++) {
    var st = allStudents[i];
    if (!currentBlock || currentBlock.batchKey !== st.batchKey) {
      if (currentBlock) {
        blocks.push(currentBlock);
      }

      var firstRow = st.row;
      // Scan upwards from first student row to find Session, Tutor, and Title rows
      var sessionRow = firstRow - 1;
      var tutorRow = -1;
      var titleRow = -1;

      for (var scanR = firstRow - 2; scanR >= Math.max(0, firstRow - 6); scanR--) {
        var label = String(values[scanR][1] || '').trim().toLowerCase();
        if ((label.indexOf('tutor') !== -1 || label.indexOf('faculty') !== -1) && tutorRow === -1) {
          tutorRow = scanR + 1;
        }
        if ((label.indexOf('title') !== -1 || label.indexOf('module') !== -1) && titleRow === -1) {
          titleRow = scanR + 1;
        }
      }

      if (tutorRow === -1) tutorRow = Math.max(1, sessionRow - 1);
      if (titleRow === -1) titleRow = Math.max(1, sessionRow - 2);

      currentBlock = {
        batchKey: st.batchKey,
        firstRow: firstRow,
        lastRow: firstRow,
        sessionRow: sessionRow,
        tutorRow: tutorRow,
        titleRow: titleRow,
        students: [st]
      };
    } else {
      currentBlock.students.push(st);
      currentBlock.lastRow = st.row;
    }
  }
  if (currentBlock) {
    blocks.push(currentBlock);
  }

  // Fallback: If no students found, scan for S1/S2/S3 headers (legacy support)
  if (blocks.length === 0) {
    var fallbackDept = "General";
    var fallbackBatch = "IV";
    for (var r = 0; r < numRows; r++) {
      var isS = false;
      for (var c = 7; c < Math.min(numCols, 60); c++) {
        var h = String(values[r][c] || '').trim().toUpperCase();
        if (h === 'S1' || h === 'S2' || h === 'S3') { isS = true; break; }
      }
      if (isS) {
        blocks.push({
          batchKey: fallbackDept + " - " + fallbackBatch,
          firstRow: r + 2,
          lastRow: numRows,
          sessionRow: r + 1,
          tutorRow: Math.max(1, r),
          titleRow: Math.max(1, r - 1),
          students: []
        });
      }
    }
  }

  return { dateColumns: dateColumns, blocks: blocks, allStudents: allStudents };
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

/**
 * Saves attendance strictly to student rows with absolute batch isolation
 */
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

  // Extract session code (S1, S2, S3)
  var sessionCode = params.sessionCode || "";
  if (!sessionCode) {
    var sLower = sessionName.toLowerCase();
    if (sLower.indexOf('session 2') !== -1 || sLower.indexOf('11:15') !== -1 || sLower === 's2' || sLower === '2') {
      sessionCode = "S2";
    } else if (sLower.indexOf('session 3') !== -1 || sLower.indexOf('02:00') !== -1 || sLower.indexOf('2pm') !== -1 || sLower === 's3' || sLower === '3') {
      sessionCode = "S3";
    } else {
      sessionCode = "S1";
    }
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
      for (var r = 0; r < Math.min(80, numRows); r++) {
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

  // 2. Identify target batch block with 100% precision
  var matchedBlock = null;
  var targetBatchKey = params.batchYear || (updates.length > 0 ? updates[0].batchYear : "");

  // Priority A: Match by batch key
  if (targetBatchKey) {
    var searchKey = cleanBatchStr(targetBatchKey);
    for (var b = 0; b < index.blocks.length; b++) {
      if (cleanBatchStr(index.blocks[b].batchKey) === searchKey) {
        matchedBlock = index.blocks[b];
        break;
      }
    }
  }

  // Priority B: Match by student name across blocks
  if (!matchedBlock && updates.length > 0) {
    for (var u = 0; u < updates.length; u++) {
      var sNameNorm = normalizeName(updates[u].name);
      if (!sNameNorm) continue;
      for (var b = 0; b < index.blocks.length; b++) {
        var blk = index.blocks[b];
        for (var s = 0; s < blk.students.length; s++) {
          if (normalizeName(blk.students[s].name) === sNameNorm) {
            matchedBlock = blk;
            break;
          }
        }
        if (matchedBlock) break;
      }
      if (matchedBlock) break;
    }
  }

  // Priority C: Fallback to single block if sheet only has 1 block
  if (!matchedBlock && index.blocks.length === 1) {
    matchedBlock = index.blocks[0];
  }

  if (!matchedBlock) {
    throw new Error("Could not identify batch block for '" + (targetBatchKey || "attendance update") + "' in sheet " + sheet.getName());
  }

  // 3. Determine deterministic target column for this session
  // In our standardized grid, each day has exactly 3 consecutive columns: S1 (+0), S2 (+1), S3 (+2)
  var sessionOffset = (sessionCode === 'S2') ? 1 : (sessionCode === 'S3') ? 2 : 0;
  var finalTargetCol = baseCol + sessionOffset;
  var sessionRowValues = values[matchedBlock.sessionRow - 1];

  // 4. Auto-heal session header cells for this day if damaged or previously overwritten
  var sessionLabels = ["S1", "S2", "S3"];
  for (var sIdx = 0; sIdx < 3; sIdx++) {
    var checkCol = baseCol + sIdx;
    if (checkCol > numCols) continue;
    var expS = sessionLabels[sIdx];
    var currentHeaderVal = sessionRowValues ? String(sessionRowValues[checkCol - 1] || '').trim().toUpperCase() : '';
    if (currentHeaderVal !== expS) {
      var sCell = sheet.getRange(matchedBlock.sessionRow, checkCol);
      safeSetCellValue(sCell, expS);
      try {
        sCell.setBackground(null);
        sCell.setFontWeight("bold");
        sCell.setHorizontalAlignment("center");
      } catch(e){}
    }
  }

  // 5. Write Module Title and Tutor into the matched block (clearing any stray attendance marks)
  var moduleTitle = params.moduleTitle || "";
  var moduleTutor = params.moduleTutor || "";

  if (matchedBlock.titleRow > 0 && matchedBlock.titleRow !== matchedBlock.sessionRow) {
    var titleCell = sheet.getRange(matchedBlock.titleRow, finalTargetCol);
    var curTitleVal = String(titleCell.getValue() || '').trim().toUpperCase();
    if (curTitleVal === 'P' || curTitleVal === 'A' || curTitleVal === 'L' || curTitleVal === 'OD') {
      try { titleCell.setBackground(null); } catch(e){}
      titleCell.setValue('');
    }
    if (moduleTitle) {
      safeSetCellValue(titleCell, moduleTitle);
      try { titleCell.setHorizontalAlignment("center"); } catch(e){}
    }
  }

  if (matchedBlock.tutorRow > 0 && matchedBlock.tutorRow !== matchedBlock.sessionRow) {
    var tutorCell = sheet.getRange(matchedBlock.tutorRow, finalTargetCol);
    var curTutorVal = String(tutorCell.getValue() || '').trim().toUpperCase();
    if (curTutorVal === 'P' || curTutorVal === 'A' || curTutorVal === 'L' || curTutorVal === 'OD') {
      try { tutorCell.setBackground(null); } catch(e){}
    }
    if (moduleTutor) {
      safeSetCellValue(tutorCell, moduleTutor);
      try { 
        tutorCell.setBackground(null);
        tutorCell.setHorizontalAlignment("center"); 
      } catch(e){}
    } else if (curTutorVal === 'P' || curTutorVal === 'A' || curTutorVal === 'L' || curTutorVal === 'OD') {
      tutorCell.setValue('');
    }
  }

  // 6. Write attendance marks for each student with STRICT BATCH ISOLATION
  var updatedCount = 0;
  for (var ru = 0; ru < updates.length; ru++) {
    var item = updates[ru];
    if (!item || !item.mark) continue;

    var targetRow = -1;
    var rawItemName = item.name ? String(item.name).trim() : "";
    var normItemName = normalizeName(rawItemName);

    // Primary: Match strictly by student name within the matched block ONLY
    if (normItemName) {
      for (var s = 0; s < matchedBlock.students.length; s++) {
        var stObj = matchedBlock.students[s];
        if (normalizeName(stObj.name) === normItemName) {
          targetRow = stObj.row;
          break;
        }
      }
    }

    // Secondary: If not found by name, match by Roll Number within matchedBlock ONLY
    if (targetRow === -1 && item.rollNo) {
      var cleanRoll = String(item.rollNo).trim().toLowerCase();
      for (var s = 0; s < matchedBlock.students.length; s++) {
        if (String(matchedBlock.students[s].rollNo || '').trim().toLowerCase() === cleanRoll) {
          targetRow = matchedBlock.students[s].row;
          break;
        }
      }
    }

    // ABSOLUTE GUARD RAIL: Ensure targetRow is strictly inside this batch's boundaries!
    if (targetRow < matchedBlock.firstRow || targetRow > matchedBlock.lastRow) {
      Logger.log("BLOCKED row " + targetRow + " outside batch [" + matchedBlock.firstRow + ", " + matchedBlock.lastRow + "] for student: " + rawItemName);
      continue;
    }

    // Write verified attendance mark
    var cell = sheet.getRange(targetRow, finalTargetCol);
    safeSetCellValue(cell, item.mark);
    cell.setHorizontalAlignment("center");
    applyStatusColor(cell, item.mark);
    updatedCount++;
  }

  return {
    targetColumn: finalTargetCol,
    columnLetter: indexToColLetter(finalTargetCol - 1),
    session: sessionCode,
    updatedCount: updatedCount,
    batchKey: matchedBlock.batchKey
  };
}

/**
 * Heals corrupted session headers (S1/S2/S3) and clears stray marks from tutor/title rows across all blocks
 */
function healSheetHeaders(sheet, params) {
  var values = sheet.getDataRange().getValues();
  var numRows = values.length;
  var numCols = sheet.getLastColumn();
  var index = buildSheetIndex(values);
  var healedCount = 0;

  var dateKeys = Object.keys(index.dateColumns);
  for (var b = 0; b < index.blocks.length; b++) {
    var blk = index.blocks[b];
    for (var d = 0; d < dateKeys.length; d++) {
      var baseCol = index.dateColumns[dateKeys[d]];
      if (!baseCol) continue;

      var sessionLabels = ["S1", "S2", "S3"];
      for (var s = 0; s < 3; s++) {
        var col = baseCol + s;
        if (col > numCols) continue;
        var expSession = sessionLabels[s];

        // 1. Restore session header cell if damaged
        var sVal = String(values[blk.sessionRow - 1][col - 1] || '').trim().toUpperCase();
        if (sVal !== expSession) {
          var sCell = sheet.getRange(blk.sessionRow, col);
          safeSetCellValue(sCell, expSession);
          try {
            sCell.setBackground(null);
            sCell.setFontWeight("bold");
            sCell.setHorizontalAlignment("center");
          } catch(e){}
          healedCount++;
        }

        // 2. Clear stray attendance marks from tutor row
        if (blk.tutorRow > 0 && blk.tutorRow !== blk.sessionRow) {
          var tVal = String(values[blk.tutorRow - 1][col - 1] || '').trim().toUpperCase();
          if (tVal === 'P' || tVal === 'A' || tVal === 'L' || tVal === 'OD') {
            var tCell = sheet.getRange(blk.tutorRow, col);
            tCell.setValue('');
            try { tCell.setBackground(null); } catch(e){}
            healedCount++;
          }
        }

        // 3. Clear stray attendance marks from title row
        if (blk.titleRow > 0 && blk.titleRow !== blk.sessionRow) {
          var tiVal = String(values[blk.titleRow - 1][col - 1] || '').trim().toUpperCase();
          if (tiVal === 'P' || tiVal === 'A' || tiVal === 'L' || tiVal === 'OD') {
            var tiCell = sheet.getRange(blk.titleRow, col);
            tiCell.setValue('');
            try { tiCell.setBackground(null); } catch(e){}
            healedCount++;
          }
        }
      }
    }
  }

  return { healedCount: healedCount, blocksCount: index.blocks.length };
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
