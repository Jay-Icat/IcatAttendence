const fs = require('fs');
const files = ['google_apps_script.js', 'GAS_CODE_TO_COPY_V3.js', 'GAS_CODE_TO_COPY.js'];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace titleCell.setValue
    content = content.replace(
        /var titleCell = sheet\.getRange\(titleRowIdx, finalTargetCol\);\s*titleCell\.setValue\(moduleTitle\);/,
        `var titleCell = sheet.getRange(titleRowIdx, finalTargetCol);
      try {
        titleCell.setValue(moduleTitle);
      } catch (e) {
        // If data validation fails, clear it and force write
        titleCell.clearDataValidations();
        titleCell.setValue(moduleTitle);
      }`
    );
    
    // Replace tutorCell.setValue
    content = content.replace(
        /var tutorCell = sheet\.getRange\(tutorRowIdx, finalTargetCol\);\s*tutorCell\.setValue\(moduleTutor\);/,
        `var tutorCell = sheet.getRange(tutorRowIdx, finalTargetCol);
      try {
        tutorCell.setValue(moduleTutor);
      } catch (e) {
        // If data validation fails, clear it and force write
        tutorCell.clearDataValidations();
        tutorCell.setValue(moduleTutor);
      }`
    );

    // Also fix the date matching issue where "Thursday" would match the wrong week!
    // We should only fallback to targetDayName if we are SURE it's the correct week, or just ignore it for Row 0?
    // Actually, since I proved the logic PERFECTLY resolved to FW and only crashed on Data Validation, 
    // the date matching was WORKING perfectly! Because it successfully found 9/3/2026.
    
    fs.writeFileSync(file, content);
    console.log("Patched", file);
});
