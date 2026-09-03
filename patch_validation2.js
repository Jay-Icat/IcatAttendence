const fs = require('fs');
const files = ['google_apps_script.js', 'GAS_CODE_TO_COPY_V3.js', 'GAS_CODE_TO_COPY.js'];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace cell.setValue(rData.mark)
    content = content.replace(
        /var cell = sheet\.getRange\(rData\.rowIndex, finalTargetCol\);\s*cell\.setValue\(rData\.mark\);/,
        `var cell = sheet.getRange(rData.rowIndex, finalTargetCol);
        try {
          cell.setValue(rData.mark);
        } catch(e) {
          cell.clearDataValidations();
          cell.setValue(rData.mark);
        }`
    );
    
    fs.writeFileSync(file, content);
    console.log("Patched", file);
});
