export const ATTENDANCE_STATUS = {
  PRESENT: {
    code: 'P',
    label: 'Present',
    badgeClass: 'badge-present',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    icon: 'Check'
  },
  ABSENT: {
    code: 'A',
    label: 'Absent',
    badgeClass: 'badge-absent',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    icon: 'X'
  },
  ON_DUTY: {
    code: 'OD',
    label: 'On-Duty',
    badgeClass: 'badge-excused',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    icon: 'FileText'
  }
};

export const DEFAULT_SESSIONS = [
  { code: 'S1', label: 'S1 (09:15 - 11:00 AM)', name: 'Session 1 (09:15 AM - 11:00 AM)' },
  { code: 'S2', label: 'S2 (11:15 - 01:00 PM)', name: 'Session 2 (11:15 AM - 01:00 PM)' },
  { code: 'S3', label: 'S3 (02:00 - 04:00 PM)', name: 'Session 3 (02:00 PM - 04:00 PM)' }
];

export const DEFAULT_SHEET_URL = process.env.NEXT_PUBLIC_SHEET_URL || '';
export const DEFAULT_APPS_SCRIPT_URL = 
  process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || 
  'https://script.google.com/macros/s/AKfycby9IEHhQ4yei1Du7y2LG_mFnqD5jP5Cj3b8lu4Ip84Ni1dkKDbQkWlueV-klVHFGRgxtw/exec';

export function getSmartCurrentSession() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  // 09:15 AM = 555 mins, 11:15 AM = 675 mins, 02:00 PM = 840 mins
  if (totalMinutes < 675) {
    return 'S1';
  } else if (totalMinutes < 840) {
    return 'S2';
  } else {
    return 'S3';
  }
}

export function isWeekend(date = new Date()) {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

export function getFormattedToday() {
  const d = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString('en-US', options);
}

export function getTodayISODate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const STORAGE_KEYS = {
  THEME: 'autoattend_theme',
  ACTIVE_SHEET: 'autoattend_active_dept'
};
