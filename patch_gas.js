const fs = require('fs');
const files = ['GAS_CODE_TO_COPY_V3.js', 'GAS_CODE_TO_COPY.js'];

files.forEach(file => {
  if (fs.existsSync(file)) {
    // Read as UTF-16LE
    let content = fs.readFileSync(file, 'utf16le');
    // If it starts with BOM, we can ignore it since utf16le decoding might include it, but JS handles strings fine.
    // However, JS indexOf will work correctly.
    
    const startIndex = content.indexOf('// Parse target date components');
    const endIndex = content.indexOf('// Build row index map for students by name and batch');
    
    if (startIndex !== -1 && endIndex !== -1) {
      const newBlock = `// Parse target date components
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

    `;
      
      content = content.substring(0, startIndex) + newBlock + content.substring(endIndex);
      // Write back as utf16le with BOM if needed, but it's safer to just write it as UTF-8 so the user doesn't have weird issues.
      // Or just write it as UTF-16LE.
      fs.writeFileSync(file, '\ufeff' + content.replace(/^\ufeff/, ''), 'utf16le');
      console.log('Patched via index (UTF-16LE)', file);
    } else {
      console.log('Could not find index in (UTF-16LE)', file);
    }
  }
});
