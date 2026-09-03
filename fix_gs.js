const fs = require("fs");
let text = fs.readFileSync("src/lib/googleSheets.js", "utf8");

text = text.replace(
  "import { DEFAULT_APPS_SCRIPT_URL } from \"./constants\";",
  "import { DEFAULT_APPS_SCRIPT_URL } from \"./constants\";\nimport { Logger } from \"./logger\";"
);

text = text.replace(
  "throw new Error(data.error || \"Failed to fetch sheet data\");",
  "Logger.error(`Failed to fetch sheet data for ${sheetName || \"\"}: ${data.error || \"Unknown Error\"}`);\n    throw new Error(data.error || \"Failed to fetch sheet data\");"
);

text = text.replace(
  "throw new Error(\"Could not access Google Sheet",
  "Logger.exception(\"Could not access Google Sheet via GViz. Access Denied.\", gvizErr.message);\n      throw new Error(\"Could not access Google Sheet"
);

fs.writeFileSync("src/lib/googleSheets.js", text, "utf8");
console.log("Updated googleSheets.js");
