/**
 * Universal Attendance Connector with Guaranteed Execution for Google Workspace
 */

import { extractSheetId, fetchViaGviz, fetchHelperList } from './gvizSheets';
import { DEFAULT_APPS_SCRIPT_URL } from './constants';
import { Logger } from './logger';

export async function fetchHelpersData(inputUrl) {
  if (!inputUrl) return { modules: [], tutors: [] };
  
  const clean = inputUrl.trim();
  const sheetId = extractSheetId(clean);
  
  if (sheetId) {
    const modules = await fetchHelperList(sheetId, 'Helper_Modules');
    const tutors = await fetchHelperList(sheetId, 'Helper_Tutors');
    return { modules, tutors };
  }
  
  return { modules: [], tutors: [] };
}

export async function testConnection(inputUrl) {
  if (!inputUrl) {
    throw new Error('Google Sheet URL or Apps Script URL is required');
  }

  const clean = inputUrl.trim();
  const sheetId = extractSheetId(clean);

  if (sheetId) {
    try {
      const deptList = ['UID', 'GAD', 'GDD', 'GT', 'GRD', 'IDS', 'ANIM', 'VFX', 'Photography', 'MMT', 'FAD'];
      await fetchViaGviz(sheetId, 'IDS', 5);
      return {
        success: true,
        message: 'Connected directly to Google Sheet!',
        spreadsheetTitle: 'Attendance Spreadsheet',
        sheets: deptList,
        mode: 'DIRECT_SHEET',
        sheetId: sheetId
      };
    } catch (gvizErr) {
      Logger.exception("Could not access Google Sheet via GViz. Access Denied.", gvizErr.message);
      throw new Error("Could not access Google Sheet. Please make sure the sheet sharing is set to 'Anyone with link can view' or 'Anyone in icat.ac.in can view'.");
    }
  }

  try {
    const proxyUrl = `/api/sheets?scriptUrl=${encodeURIComponent(clean)}&action=test`;
    const res = await fetch(proxyUrl);
    const data = await res.json();
    if (data && data.success) return data;
    throw new Error(data.error || 'Could not connect via Apps Script.');
  } catch (proxyErr) {
    throw proxyErr;
  }
}

export async function fetchSheetData(inputUrl, sheetName = 'IDS', columnMapping = {}) {
  if (!inputUrl) {
    throw new Error('URL is required');
  }

  const clean = inputUrl.trim();
  const sheetId = extractSheetId(clean);

  if (sheetId) {
    return await fetchViaGviz(sheetId, sheetName || 'IDS', columnMapping.headerRow || 5);
  }

  try {
    let proxyUrl = `/api/sheets?scriptUrl=${encodeURIComponent(clean)}&action=getSheetData`;
    if (sheetName) proxyUrl += `&sheetName=${encodeURIComponent(sheetName)}`;
    if (columnMapping.headerRow) proxyUrl += `&headerRow=${columnMapping.headerRow || 5}`;

    const res = await fetch(proxyUrl);
    const data = await res.json();
    if (data && data.success) return data;
    throw new Error(data.error || 'Failed to fetch sheet data');
  } catch (err) {
    throw err;
  }
}

/**
 * Seamless, popup-less Attendance Sync Engine
 * Proxies attendance writing through /api/sync for instant background execution
 * across iOS/Android standalone WebApps and desktop browsers without popups.
 */
export async function saveAttendanceToSheet(inputUrl, payload) {
  const targetScriptUrl = (inputUrl && inputUrl.includes('script.google.com')) 
    ? inputUrl.trim() 
    : DEFAULT_APPS_SCRIPT_URL;

  const response = await fetch('/api/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      scriptUrl: targetScriptUrl,
      sheetName: payload.sheetName || 'GT',
      date: payload.date || '',
      session: payload.session || '',
      sessionCode: payload.sessionCode || '',
      moduleTitle: payload.moduleTitle || '',
      moduleTutor: payload.moduleTutor || '',
      updates: payload.updates || []
    })
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to sync attendance with Google Sheet');
  }

  return {
    success: true,
    message: data.message || 'Attendance synced to Google Sheet!',
    result: data.result || null
  };
}

/**
 * Calculates attendance statistics
 */
export function calculateStats(students = [], currentAttendance = {}) {
  const total = students.length;
  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;
  let unmarked = 0;

  students.forEach(student => {
    const status = currentAttendance[student.id] || currentAttendance[student.name];
    if (status === 'P') present++;
    else if (status === 'A') absent++;
    else if (status === 'L') late++;
    else if (status === 'OD') excused++;
    else unmarked++;
  });

  const markedTotal = present + absent + late + excused;
  const effectivePresent = present + (late * 0.5) + excused;
  const percentage = markedTotal > 0 ? Math.round((effectivePresent / markedTotal) * 100) : 0;

  return {
    total,
    present,
    absent,
    late,
    excused,
    unmarked,
    markedTotal,
    percentage
  };
}

/**
 * Computes overall cumulative attendance statistics
 */
export function computeStudentCumulativeStats(student, newSessionHeader, newSessionMark) {
  const history = { ...student.history };
  if (newSessionHeader && newSessionMark) {
    history[newSessionHeader] = newSessionMark;
  }

  const sessionKeys = Object.keys(history);
  if (sessionKeys.length === 0) {
    return { totalSessions: 0, attended: 0, percentage: 100, isDefaulter: false };
  }

  let totalSessions = 0;
  let attended = 0;

  sessionKeys.forEach(key => {
    const mark = String(history[key] || '').toUpperCase().trim();
    if (mark === 'P' || mark === 'PRESENT' || mark === '1') {
      totalSessions++;
      attended++;
    } else if (mark === 'A' || mark === 'ABSENT' || mark === '0') {
      totalSessions++;
    } else if (mark === 'L' || mark === 'LATE') {
      totalSessions++;
      attended += 0.5;
    } else if (mark === 'OD' || mark === 'EXCUSED') {
      totalSessions++;
      attended++;
    }
  });

  const percentage = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 100;
  const isDefaulter = percentage < 75 && totalSessions >= 2;

  return {
    totalSessions,
    attended,
    percentage,
    isDefaulter
  };
}
