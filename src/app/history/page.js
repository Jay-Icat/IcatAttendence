import HistoryClient from './HistoryClient';

export const metadata = {
  title: 'Attendance History | ICAT-Attendance',
  description: 'View recorded attendance history sessions across ICAT departments and faculty.',
};

export default function HistoryPage() {
  return <HistoryClient />;
}
