const fs = require('fs');
let content = fs.readFileSync('src/app/page.js', 'utf8');

const regex = /const savedUrl = localStorage.*?setSheetUrlInput.*?}/s;

const newBlock = `const savedSheetUrl = localStorage.getItem(STORAGE_KEYS.SHEET_URL) || DEFAULT_SHEET_URL || '';
      const savedScriptUrl = localStorage.getItem(STORAGE_KEYS.SCRIPT_URL) || '';
      if (savedSheetUrl) {
        setSheetUrl(savedSheetUrl);
        setSheetUrlInput(savedSheetUrl);
      }
      if (savedScriptUrl) {
        setScriptUrl(savedScriptUrl);
      }`;

if (regex.test(content)) {
    content = content.replace(regex, newBlock);
    fs.writeFileSync('src/app/page.js', content);
    console.log('Patched useEffect successfully via regex');
} else {
    console.log('Could not find the target block via regex');
}
