const fs = require('fs');
const files = ['google_apps_script.js', 'GAS_CODE_TO_COPY_V3.js', 'GAS_CODE_TO_COPY.js'];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    content = content.replace(
        'titleCell.setValue(moduleTitle);',
        `try {
        titleCell.setValue(moduleTitle);
      } catch (e) {
        titleCell.clearDataValidations();
        titleCell.setValue(moduleTitle);
      }`
    );
    
    content = content.replace(
        'tutorCell.setValue(moduleTutor);',
        `try {
        tutorCell.setValue(moduleTutor);
      } catch (e) {
        tutorCell.clearDataValidations();
        tutorCell.setValue(moduleTutor);
      }`
    );
    
    // For rData.mark
    content = content.replace(
        'cell.setValue(rData.mark);',
        `try {
          cell.setValue(rData.mark);
        } catch (e) {
          cell.clearDataValidations();
          cell.setValue(rData.mark);
        }`
    );

    fs.writeFileSync(file, content);
    console.log("Patched", file);
});
