import './globals.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'AutoAttendance | Automated Google Sheets Attendance Dashboard',
  description: 'Effortlessly take and sync student attendance directly with your Google Sheet in real time with 1-click precision.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>" />
      </head>
      <body>
        <div className="ambient-bg">
          <div className="ambient-blob-1"></div>
          <div className="ambient-blob-2"></div>
        </div>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
