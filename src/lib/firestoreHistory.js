import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Logger } from './logger';

export const COLLECTION_NAME = 'attendance_history';

/**
 * Returns current month key in 'YYYY-MM' format (e.g., '2026-09')
 */
export function getCurrentMonthKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Extracts month key from a date string (e.g., '2026-09-05' -> '2026-09')
 */
export function getMonthKeyFromDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return getCurrentMonthKey();
  const parts = dateStr.split('-');
  if (parts.length >= 2) {
    return `${parts[0]}-${parts[1]}`;
  }
  return getCurrentMonthKey();
}

/**
 * Saves attendance record to Firestore first before/during sync.
 * Strictly captures the logged-in teacher (from Google account), module, dept, batch, tutor, date, and stats.
 */
export async function saveAttendanceHistory(record) {
  if (!db) {
    throw new Error('Firestore database is not initialized. Please verify Firebase setup.');
  }

  const date = record.date || new Date().toISOString().split('T')[0];
  const monthKey = getMonthKeyFromDate(date);

  const documentData = {
    date: date,
    monthKey: monthKey,
    timestamp: Date.now(),
    createdAt: serverTimestamp(),
    
    // Teacher identity from logged-in Google Account (NOT the module tutor)
    teacherName: record.teacherName || 'Faculty',
    teacherEmail: record.teacherEmail || '',
    teacherPhoto: record.teacherPhoto || '',

    // Academic details
    department: record.department || '',
    batch: record.batch || 'ALL',
    module: record.module || 'General',
    moduleTutor: record.moduleTutor || 'Unassigned',
    session: record.session || '',

    // Attendance stats
    presentCount: Number(record.presentCount || 0),
    absentCount: Number(record.absentCount || 0),
    odCount: Number(record.odCount || 0),
    totalMarked: Number(record.totalMarked || 0),

    // Student roster status snapshot
    studentRecords: Array.isArray(record.studentRecords) ? record.studentRecords : []
  };

  try {
    const colRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(colRef, documentData);
    Logger.info(`Attendance history saved to Firestore doc: ${docRef.id}`);

    // Asynchronously trigger old month cleanup (1st to last day of current month retained)
    purgeOldMonthHistory().catch(err => {
      console.warn('Background old month purge warning:', err);
    });

    return docRef.id;
  } catch (err) {
    Logger.error('Failed to save attendance history to Firestore', err);
    throw err;
  }
}

/**
 * Fetches attendance history from Firestore for the current calendar month.
 * Automatically excludes/purges prior months.
 */
export async function fetchCurrentMonthHistory() {
  if (!db) {
    throw new Error('Firestore database is not initialized.');
  }

  const currentMonth = getCurrentMonthKey();
  const colRef = collection(db, COLLECTION_NAME);

  try {
    // Query for documents matching the current month
    const q = query(
      colRef,
      where('monthKey', '==', currentMonth)
    );

    const snapshot = await getDocs(q);
    const historyList = [];

    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      historyList.push({
        id: docSnapshot.id,
        ...data,
        // Convert timestamp or createdAt to readable date if needed
        syncTime: data.timestamp ? new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '',
      });
    });

    // Sort descending by timestamp / date (newest first)
    historyList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return historyList;
  } catch (err) {
    Logger.error('Failed to fetch attendance history from Firestore', err);
    throw err;
  }
}

/**
 * Enforces strict one-month data retention policy:
 * Deletes any records where monthKey < currentMonthKey (prior calendar months).
 */
export async function purgeOldMonthHistory() {
  if (!db) return;

  const currentMonth = getCurrentMonthKey();
  const colRef = collection(db, COLLECTION_NAME);

  try {
    const q = query(
      colRef,
      where('monthKey', '<', currentMonth)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    let deletedCount = 0;
    const deletePromises = [];

    snapshot.forEach((docSnapshot) => {
      deletePromises.push(deleteDoc(doc(db, COLLECTION_NAME, docSnapshot.id)));
      deletedCount++;
    });

    await Promise.all(deletePromises);
    Logger.info(`Cleaned up ${deletedCount} expired attendance history records from previous months.`);
  } catch (err) {
    // Non-fatal cleanup warning
    console.warn('Failed to purge expired records:', err?.message || err);
  }
}
