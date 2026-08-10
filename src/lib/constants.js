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
  LATE: {
    code: 'L',
    label: 'Late',
    badgeClass: 'badge-late',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    icon: 'Clock'
  },
  EXCUSED: {
    code: 'OD',
    label: 'On-Duty / Excused',
    badgeClass: 'badge-excused',
    color: '#6366f1',
    bgColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: 'rgba(99, 102, 241, 0.4)',
    icon: 'FileText'
  }
};

export const DEFAULT_SESSIONS = [
  'Session 1 (09:15 AM - 11:00 AM)',
  'Session 2 (11:15 AM - 01:00 PM)',
  'Session 3 (02:00 PM - 04:00 PM)'
];

export const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby9IEHhQ4yei1Du7y2LG_mFnqD5jP5Cj3b8lu4Ip84Ni1dkKDbQkWlueV-klVHFGRgxtw/exec';

export function getSmartCurrentSession() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  if (totalMinutes < 675) {
    return DEFAULT_SESSIONS[0]; // Session 1
  } else if (totalMinutes < 840) {
    return DEFAULT_SESSIONS[1]; // Session 2
  } else {
    return DEFAULT_SESSIONS[2]; // Session 3
  }
}

export const STORAGE_KEYS = {
  SCRIPT_URL: 'autoattend_script_url',
  SHEET_NAME: 'autoattend_active_sheet',
  COLUMN_MAPPING: 'autoattend_col_mapping',
  THEME: 'autoattend_theme',
  CUSTOM_SESSIONS: 'autoattend_custom_sessions',
  CACHED_ATTENDANCE: 'autoattend_cached_state'
};
