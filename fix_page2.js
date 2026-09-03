const fs = require("fs");
let text = fs.readFileSync("src/app/page.js", "utf8");

// Fix import
text = text.replace(
  "import { fetchSheetData, saveAttendanceToSheet, fetchHelpersData } from \"../lib/googleSheets\";",
  "import { fetchSheetData, saveAttendanceToSheet, fetchHelpersData } from \"../lib/googleSheets\";\nimport { Logger } from \"../lib/logger\";"
);
text = text.replace(
  "import { fetchSheetData, saveAttendanceToSheet, fetchHelpersData } from '../lib/googleSheets';",
  "import { fetchSheetData, saveAttendanceToSheet, fetchHelpersData } from '../lib/googleSheets';\nimport { Logger } from \"../lib/logger\";"
);

// Disable sync button logic
text = text.replace(
  "disabled={isSyncing || markedCount === 0}",
  "disabled={isSyncing || markedCount === 0 || (modulesList.length > 0 && !selectedModule) || (tutorsList.length > 0 && !selectedTutor)}"
);

fs.writeFileSync("src/app/page.js", text, "utf8");
console.log("Updated page.js 2");
