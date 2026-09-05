import './globals.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'ICAT-Attendance | Automated Attendance Portal',
  description: 'Official student attendance system for ICAT Design & Media College. Effortlessly take and sync student attendance directly with Google Sheets in real time.',
  icons: {
    icon: '/icat-emblem.png',
    shortcut: '/icat-emblem.png',
    apple: '/icat-emblem.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" type="image/png" href="/icat-emblem.png" />
        <link rel="shortcut icon" href="/icat-emblem.png" />
        <link rel="apple-touch-icon" href="/icat-emblem.png" />
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
