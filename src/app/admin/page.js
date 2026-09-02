import { readFileSync } from 'fs';
import path from 'path';
import AdminClient from './AdminClient';

export default function AdminPage() {
  let scriptContent = '';
  try {
    const filePath = path.join(process.cwd(), 'google_apps_script.js');
    scriptContent = readFileSync(filePath, 'utf8');
  } catch (error) {
    scriptContent = '// Could not load script file from server.';
  }

  return <AdminClient scriptContent={scriptContent} />;
}
