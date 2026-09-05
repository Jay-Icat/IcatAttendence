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

// Hardcoded as requested
export const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1GR9hWCoRSDntN-oOtdx83hio_7Ol4RvDNRhVGH4310s/edit?gid=1032342523#gid=1032342523';

export const DEFAULT_APPS_SCRIPT_URL = 
  process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || 
  'https://script.google.com/macros/s/AKfycby9IEHhQ4yei1Du7y2LG_mFnqD5jP5Cj3b8lu4Ip84Ni1dkKDbQkWlueV-klVHFGRgxtw/exec';

export function getSmartCurrentSession() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;

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
  return day === 0 || day === 6;
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

export function parseISODate(isoStr) {
  if (!isoStr) return new Date();
  const parts = isoStr.split('-').map(Number);
  if (parts.length === 3) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date(isoStr);
}

export function isDateWeekend(dateOrIso) {
  const d = typeof dateOrIso === 'string' ? parseISODate(dateOrIso) : (dateOrIso || new Date());
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function formatCustomDate(dateOrIso) {
  const d = typeof dateOrIso === 'string' ? parseISODate(dateOrIso) : (dateOrIso || new Date());
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString('en-US', options);
}

export function getDaysInCurrentMonth(baseDate = new Date()) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const todayStr = getTodayISODate();

  const days = [];
  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(year, month, day);
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(month + 1).padStart(2, '0');
    const iso = `${year}-${monthStr}-${dayStr}`;
    const dayOfWeek = d.getDay();
    const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
    const weekdayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    const isToday = iso === todayStr;

    days.push({
      iso,
      day,
      label: `Date: ${monthName} ${dayStr} (${weekdayName})${isToday ? ' • Today' : ''}${isWeekendDay ? ' - Weekend' : ''}`,
      isWeekend: isWeekendDay,
      isToday
    });
  }
  return days;
}

export const STORAGE_KEYS = {
  THEME: 'autoattend_theme',
  ACTIVE_SHEET: 'autoattend_active_dept',
  SHEET_URL: 'autoattend_sheet_url',
  SCRIPT_URL: 'autoattend_script_url'
};
