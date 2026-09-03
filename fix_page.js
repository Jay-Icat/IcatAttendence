const fs = require("fs");
let text = fs.readFileSync("src/app/page.js", "utf8");
text = text.replace(
  "import { fetchSheetData, saveAttendanceToSheet, fetchHelpersData } from \"../lib/googleSheets\";",
  "import { fetchSheetData, saveAttendanceToSheet, fetchHelpersData } from \"../lib/googleSheets\";\nimport { Logger } from \"../lib/logger\";"
);

text = text.replace(
  /console\.warn\('Could not load sheet data for', targetSheet, err\);/g,
  "Logger.warn(`Could not load sheet data for ${targetSheet}`, err.message);"
);

text = text.replace(
  /console\.error\('Sync failed:', err\);/g,
  "Logger.error(`Sync failed for ${activeSheet}`, err.message);"
);

// Inject Logger.info for sync started
text = text.replace(
  "const payload = {",
  "Logger.info(`Starting sync for ${activeSheet}, Session: ${selectedSession}, Marked: ${markedCount}`);\n    const payload = {"
);

// Inject Logger.info for sync success
text = text.replace(
  "setSyncSuccess(true);",
  "Logger.info(`Sync successful for ${activeSheet}!`);\n      setSyncSuccess(true);"
);

fs.writeFileSync("src/app/page.js", text, "utf8");
console.log("Updated page.js");
