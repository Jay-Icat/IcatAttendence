const fs = require('fs');

function patchFile(filename) {
    const isUTF16 = filename.includes('GAS_CODE_TO_COPY');
    let content = fs.readFileSync(filename, isUTF16 ? 'utf16le' : 'utf8');

    const oldBlock = `  // Write Title and Tutor to the cells directly above the anchor
  if (sessionRowIdx > 2) {
    if (moduleTitle) {
      var titleCell = sheet.getRange(sessionRowIdx - 2, finalTargetCol);
      titleCell.setValue(moduleTitle);
      titleCell.setHorizontalAlignment("center");
    }
    if (moduleTutor) {
      var tutorCell = sheet.getRange(sessionRowIdx - 1, finalTargetCol);
      tutorCell.setValue(moduleTutor);
      tutorCell.setHorizontalAlignment("center");
    }
  }`;

    const newBlock = `  // Dynamically find Title and Tutor rows by scanning Column B upwards
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
    titleCell.setValue(moduleTitle);
    titleCell.setHorizontalAlignment("center");
  }
  if (moduleTutor && tutorRowIdx > 0 && tutorRowIdx !== sessionRowIdx) {
    // Prevent overwriting the Session row in broken sheets (like GDD)
    var tutorCell = sheet.getRange(tutorRowIdx, finalTargetCol);
    tutorCell.setValue(moduleTutor);
    tutorCell.setHorizontalAlignment("center");
  }`;

    // Normalize line endings to avoid matching issues
    const normalizedContent = content.replace(/\r\n/g, '\n');
    const normalizedOld = oldBlock.replace(/\r\n/g, '\n');
    
    // Check if it exists with regex matching spaces
    // Since spaces might differ, a safer way is to just use a RegExp that ignores spaces
    let escapedOld = normalizedOld.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\s+/g, '\\s*');
    let regex = new RegExp(escapedOld);
    
    if (regex.test(normalizedContent)) {
        content = normalizedContent.replace(regex, newBlock);
        fs.writeFileSync(filename, content, isUTF16 ? 'utf16le' : 'utf8');
        console.log('Done ' + filename);
    } else {
        console.log('Done ' + filename);
    }
}

patchFile('google_apps_script.js');
patchFile('GAS_CODE_TO_COPY_V3.js');
patchFile('GAS_CODE_TO_COPY.js');
