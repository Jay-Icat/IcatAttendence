/**
 * Cloud Configuration Service
 * Persists and synchronizes Google Sheet URL and Apps Script details
 * to Firebase Firestore for seamless multi-device, cross-browser availability.
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { STORAGE_KEYS, DEFAULT_SHEET_URL, DEFAULT_APPS_SCRIPT_URL } from './constants';
import { Logger } from './logger';

export const CONFIG_COLLECTION = 'app_config';
export const CONFIG_DOC_ID = 'settings';
export const FALLBACK_COLLECTION = 'attendance_history';
export const FALLBACK_DOC_ID = '_app_config_settings_';

/**
 * Saves configuration to Cloud Firestore and mirrors to local storage.
 * Supports dual-save to app_config and attendance_history for maximum resilience.
 */
export async function saveAppConfig({ sheetUrl = '', scriptUrl = '', scriptCode = '' }) {
  const cleanSheetUrl = (sheetUrl || '').trim();
  const cleanScriptUrl = (scriptUrl || '').trim();

  // 1. Immediately cache in local storage on current machine
  try {
    if (typeof window !== 'undefined') {
      if (cleanSheetUrl) {
        localStorage.setItem(STORAGE_KEYS.SHEET_URL, cleanSheetUrl);
      } else {
        localStorage.removeItem(STORAGE_KEYS.SHEET_URL);
      }

      if (cleanScriptUrl) {
        localStorage.setItem(STORAGE_KEYS.SCRIPT_URL, cleanScriptUrl);
      } else {
        localStorage.removeItem(STORAGE_KEYS.SCRIPT_URL);
      }
    }
  } catch (storageErr) {
    console.warn('Could not save config to localStorage:', storageErr);
  }

  // 2. Persist to Cloud Firestore if configured
  if (!isFirebaseConfigured || !db) {
    Logger.warn('Firebase is not configured. Config saved only to local browser storage.');
    return { success: true, cloudSaved: false, message: 'Saved to local browser storage only (Firebase not configured).' };
  }

  const payload = {
    sheetUrl: cleanSheetUrl,
    scriptUrl: cleanScriptUrl,
    updatedAt: serverTimestamp(),
    updatedAtMs: Date.now()
  };

  if (scriptCode) {
    payload.scriptCode = scriptCode;
  }

  let cloudSaved = false;
  let saveError = null;

  // Primary attempt: app_config/settings
  try {
    const primaryRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
    await setDoc(primaryRef, payload, { merge: true });
    cloudSaved = true;
    Logger.info('Successfully saved app configuration to Firestore (app_config/settings).');
  } catch (err) {
    saveError = err;
    console.warn('Primary Firestore config save (app_config) failed, trying fallback:', err.message);
  }

  // Fallback attempt: attendance_history/_app_config_settings_
  // Works with existing Firestore rules if user is authenticated with @icat.ac.in Google account
  try {
    const fallbackRef = doc(db, FALLBACK_COLLECTION, FALLBACK_DOC_ID);
    await setDoc(fallbackRef, payload, { merge: true });
    cloudSaved = true;
    Logger.info('Successfully saved app configuration to Firestore fallback (attendance_history/_app_config_settings_).');
  } catch (err) {
    if (!cloudSaved) {
      saveError = err;
    }
  }

  if (cloudSaved) {
    return { 
      success: true, 
      cloudSaved: true, 
      message: 'Configuration saved to Firebase Cloud! All systems and devices will now use this setup.' 
    };
  }

  throw new Error(saveError?.message || 'Failed to save configuration to Firebase Cloud.');
}

/**
 * Fetches the latest configuration from Firebase Firestore.
 * Falls back to local storage and default constants if offline or unconfigured.
 */
export async function fetchAppConfig() {
  let cloudConfig = null;

  if (isFirebaseConfigured && db) {
    // 1. Try primary collection: app_config/settings
    try {
      const primaryRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
      const snapshot = await getDoc(primaryRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && (data.sheetUrl || data.scriptUrl)) {
          cloudConfig = data;
        }
      }
    } catch (err) {
      // Permission denied or network issue
      console.warn('Could not read from primary app_config:', err.message);
    }

    // 2. If not found in primary, try fallback collection: attendance_history/_app_config_settings_
    if (!cloudConfig) {
      try {
        const fallbackRef = doc(db, FALLBACK_COLLECTION, FALLBACK_DOC_ID);
        const snapshot = await getDoc(fallbackRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && (data.sheetUrl || data.scriptUrl)) {
            cloudConfig = data;
          }
        }
      } catch (err) {
        console.warn('Could not read from fallback config:', err.message);
      }
    }
  }

  // 3. Resolve effective values
  let localSheetUrl = '';
  let localScriptUrl = '';
  try {
    if (typeof window !== 'undefined') {
      localSheetUrl = localStorage.getItem(STORAGE_KEYS.SHEET_URL) || '';
      localScriptUrl = localStorage.getItem(STORAGE_KEYS.SCRIPT_URL) || '';
    }
  } catch (e) {}

  const effectiveSheetUrl = cloudConfig?.sheetUrl || localSheetUrl || DEFAULT_SHEET_URL || '';
  const effectiveScriptUrl = cloudConfig?.scriptUrl || localScriptUrl || DEFAULT_APPS_SCRIPT_URL || '';
  const effectiveScriptCode = cloudConfig?.scriptCode || '';

  // 4. Mirror cloud values into localStorage if newer
  if (cloudConfig) {
    try {
      if (typeof window !== 'undefined') {
        if (cloudConfig.sheetUrl) {
          localStorage.setItem(STORAGE_KEYS.SHEET_URL, cloudConfig.sheetUrl);
        }
        if (cloudConfig.scriptUrl) {
          localStorage.setItem(STORAGE_KEYS.SCRIPT_URL, cloudConfig.scriptUrl);
        }
      }
    } catch (e) {}
  }

  return {
    sheetUrl: effectiveSheetUrl,
    scriptUrl: effectiveScriptUrl,
    scriptCode: effectiveScriptCode,
    isFromCloud: Boolean(cloudConfig),
    updatedAtMs: cloudConfig?.updatedAtMs || null
  };
}

/**
 * Resolves local storage key for a user's active department tab
 */
export function getUserDeptStorageKey(email) {
  if (!email) return STORAGE_KEYS.ACTIVE_SHEET;
  return `${STORAGE_KEYS.ACTIVE_SHEET}_${String(email).toLowerCase().trim()}`;
}

/**
 * Saves the active department for a specific user to localStorage and Firestore
 */
export async function saveUserActiveDept(email, department) {
  if (!department) return;
  const cleanDept = String(department).trim();

  // 1. Immediately cache in localStorage
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SHEET, cleanDept);
      if (email) {
        localStorage.setItem(getUserDeptStorageKey(email), cleanDept);
      }
    }
  } catch (e) {}

  // 2. Persist to Firestore if user email and Firebase are present
  if (!email || !isFirebaseConfigured || !db) return;

  const sanitizedEmail = String(email).toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
  const payload = {
    email: String(email).toLowerCase().trim(),
    activeDept: cleanDept,
    updatedAt: serverTimestamp(),
    updatedAtMs: Date.now()
  };

  try {
    const userPrefRef = doc(db, CONFIG_COLLECTION, `user_${sanitizedEmail}`);
    await setDoc(userPrefRef, payload, { merge: true });
  } catch (err) {
    // If permission error on app_config, try fallback in attendance_history
    try {
      const fallbackRef = doc(db, FALLBACK_COLLECTION, `_user_pref_${sanitizedEmail}`);
      await setDoc(fallbackRef, payload, { merge: true });
    } catch (fallbackErr) {
      console.warn('Could not save user department preference to cloud:', fallbackErr);
    }
  }
}

/**
 * Fetches the active department for a specific user from localStorage and Cloud Firestore
 */
export async function fetchUserActiveDept(email) {
  let localDept = null;
  try {
    if (typeof window !== 'undefined') {
      if (email) {
        localDept = localStorage.getItem(getUserDeptStorageKey(email));
      }
      if (!localDept) {
        localDept = localStorage.getItem(STORAGE_KEYS.ACTIVE_SHEET);
      }
    }
  } catch (e) {}

  if (!email || !isFirebaseConfigured || !db) {
    return localDept || null;
  }

  const sanitizedEmail = String(email).toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
  try {
    const userPrefRef = doc(db, CONFIG_COLLECTION, `user_${sanitizedEmail}`);
    const snap = await getDoc(userPrefRef);
    if (snap.exists() && snap.data()?.activeDept) {
      const cloudDept = snap.data().activeDept;
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(getUserDeptStorageKey(email), cloudDept);
          localStorage.setItem(STORAGE_KEYS.ACTIVE_SHEET, cloudDept);
        }
      } catch (e) {}
      return cloudDept;
    }
  } catch (err) {
    try {
      const fallbackRef = doc(db, FALLBACK_COLLECTION, `_user_pref_${sanitizedEmail}`);
      const snap = await getDoc(fallbackRef);
      if (snap.exists() && snap.data()?.activeDept) {
        const cloudDept = snap.data().activeDept;
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(getUserDeptStorageKey(email), cloudDept);
            localStorage.setItem(STORAGE_KEYS.ACTIVE_SHEET, cloudDept);
          }
        } catch (e) {}
        return cloudDept;
      }
    } catch (fallbackErr) {}
  }

  return localDept || null;
}
