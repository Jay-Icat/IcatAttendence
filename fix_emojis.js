const fs = require('fs');
const files = ['AutoAttendanceAPI.gs', 'google_apps_script.js', 'GAS_CODE_TO_COPY_V3.js', 'GAS_CODE_TO_COPY.js'];
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/<div style="font-size:44px;margin-bottom:10px;">' \+ \(output\.success \? '.*?' : '.*?'\) \+ '<\/div>/, `<div style="font-size:44px;margin-bottom:10px;">' + (output.success ? '✅' : '❌') + '</div>`);
  fs.writeFileSync(f, c, 'utf8');
});
console.log("Fixed Emojis");
