const fs = require('fs');
let text = fs.readFileSync('src/components/Header.jsx', 'utf8');

text = text.replace(
  "import { Sparkles, Sun, Moon, Layers } from 'lucide-react';",
  "import { Sparkles, Sun, Moon, Layers, FileText } from 'lucide-react';\nimport Link from 'next/link';"
);

text = text.replace(
  "{/* Theme Toggle Button */}",
  `<Link href="/log" className="btn-theme-toggle" title="System Logs" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>\n          <FileText size={18} />\n        </Link>\n\n        {/* Theme Toggle Button */}`
);

fs.writeFileSync('src/components/Header.jsx', text, 'utf8');
console.log('Updated Header.jsx');
