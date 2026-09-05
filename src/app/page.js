'use client';

import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  Calendar, 
  CheckCheck, 
  XCircle, 
  Filter, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Link as LinkIcon
} from 'lucide-react';

import Header from '../components/Header';
import StudentRow from '../components/StudentRow';
import WeekendHoliday from '../components/WeekendHoliday';
import { 
  DEFAULT_SESSIONS, 
  DEFAULT_SHEET_URL, 
  DEFAULT_APPS_SCRIPT_URL, 
  STORAGE_KEYS, 
  getSmartCurrentSession, 
  isWeekend, 
  getFormattedToday, 
  getTodayISODate,
  isDateWeekend,
  formatCustomDate,
  getDaysInCurrentMonth
} from '../lib/constants';
import { fetchSheetData, saveAttendanceToSheet, fetchHelpersData } from '../lib/googleSheets';
import { Logger } from "../lib/logger";
import { ALL_DEPARTMENTS } from '../lib/gvizSheets';

export default function AttendancePage() {
  // Theme state
  const [theme, setTheme] = useState('dark');

  // Sheet & Department State
  const [sheets, setSheets] = useState(ALL_DEPARTMENTS);
  const [activeSheet, setActiveSheet] = useState('GT');
  const [isConnected, setIsConnected] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [scriptUrl, setScriptUrl] = useState('');
  const [sheetUrlInput, setSheetUrlInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Helper State (Modules & Tutors)
  const [modulesList, setModulesList] = useState([]);
  const [tutorsList, setTutorsList] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedTutor, setSelectedTutor] = useState('');

  // Student & Batch Data
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Dev mode detection (hidden in release/production mode)
  const [isReleaseModeOverride, setIsReleaseModeOverride] = useState(false);
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('mode') === 'release' || params.get('release') === 'true') {
          setIsReleaseModeOverride(true);
        }
      }
    } catch (e) {}
  }, []);

  const isDev = process.env.NODE_ENV === 'development' && !isReleaseModeOverride;

  // Session & Date State (In release mode locked strictly to today; in dev mode allows month override)
  const todayISO = getTodayISODate();
  const [selectedDate, setSelectedDate] = useState(todayISO);

  // Available dates in current month for dev selection
  const availableDates = useMemo(() => {
    return getDaysInCurrentMonth();
  }, []);

  // Effective date: in dev mode use selectedDate, in release mode strictly lock to today
  const effectiveDate = isDev ? selectedDate : todayISO;
  const effectiveDateFormatted = useMemo(() => formatCustomDate(effectiveDate), [effectiveDate]);
  const isEffectiveWeekend = useMemo(() => isDateWeekend(effectiveDate), [effectiveDate]);

  const [selectedSession, setSelectedSession] = useState(getSmartCurrentSession());

  // Attendance State { studentId: 'P' | 'A' | 'OD' }
  const [currentAttendance, setCurrentAttendance] = useState({});

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState(null);

  // Initialize theme & sheet URL from localStorage or env
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);

      const savedSheetUrl = localStorage.getItem(STORAGE_KEYS.SHEET_URL) || DEFAULT_SHEET_URL || '';
      const savedScriptUrl = localStorage.getItem(STORAGE_KEYS.SCRIPT_URL) || '';
      if (savedSheetUrl) {
        setSheetUrl(savedSheetUrl);
        setSheetUrlInput(savedSheetUrl);
      }
      if (savedScriptUrl) {
        setScriptUrl(savedScriptUrl);
      }
    } catch (e) {}
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, nextTheme);
    } catch (e) {}
  };

  // Load Department Data
  const loadDepartmentData = async (targetSheet, customUrl = '') => {
    setIsLoading(true);
    const activeUrl = customUrl || sheetUrl || DEFAULT_SHEET_URL || DEFAULT_APPS_SCRIPT_URL;

    if (!activeUrl) {
      setIsLoading(false);
      setIsConnected(false);
      return;
    }

    try {
      const data = await fetchSheetData(activeUrl, targetSheet);
      const helpers = await fetchHelpersData(activeUrl);
      
      setModulesList(helpers.modules || []);
      setTutorsList(helpers.tutors || []);
      
      if (data.success && data.data) {
        setIsConnected(true);
        setStudents(data.data.students || []);
        if (data.data.batches && data.data.batches.length > 0) {
          setBatches(data.data.batches);
          setSelectedBatch(data.data.batches[0]);
        } else {
          setBatches(['IV', 'III', 'II', 'I']);
          setSelectedBatch('IV');
        }
      }
    } catch (err) {
      Logger.warn(`Could not load sheet data for ${targetSheet}`, err.message);
      setIsConnected(false);
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Connect / Save Sheet URL
  const handleConnectSheet = async (e) => {
    if (e) e.preventDefault();
    if (!sheetUrlInput.trim()) return;

    setIsConnecting(true);
    const cleanUrl = sheetUrlInput.trim();
    setSheetUrl(cleanUrl);

    try {
      localStorage.setItem(STORAGE_KEYS.SHEET_URL, cleanUrl);
      localStorage.setItem(STORAGE_KEYS.SCRIPT_URL, cleanUrl);
    } catch (err) {}

    await loadDepartmentData(activeSheet, cleanUrl);
    setIsConnecting(false);
  };

  // Load sheet when activeSheet changes or when sheetUrl is initialized
  useEffect(() => {
    if (sheetUrl) {
      loadDepartmentData(activeSheet, sheetUrl);
    }
  }, [activeSheet, sheetUrl]);

  // Switch Department Tab
  const handleSelectSheet = (newSheet) => {
    setActiveSheet(newSheet);
    setCurrentAttendance({});
  };

  // Switch Date (Dev Mode)
  const handleSelectDate = (newDate) => {
    setSelectedDate(newDate);
    setCurrentAttendance({});
  };

  // Single Student Status Change (P, A, OD)
  const handleStatusChange = (studentId, newStatus) => {
    setCurrentAttendance((prev) => ({
      ...prev,
      [studentId]: newStatus
    }));
  };

  // Filtered Students List by Batch
  const filteredStudents = useMemo(() => {
    if (selectedBatch === 'ALL') return students;
    return students.filter((s) => s.batchYear === selectedBatch);
  }, [students, selectedBatch]);

  // Batch Quick Actions
  const handleMarkAllPresent = () => {
    const updated = { ...currentAttendance };
    filteredStudents.forEach((s) => {
      updated[s.id] = 'P';
    });
    setCurrentAttendance(updated);
  };

  const handleMarkAllAbsent = () => {
    const updated = { ...currentAttendance };
    filteredStudents.forEach((s) => {
      updated[s.id] = 'A';
    });
    setCurrentAttendance(updated);
  };

  // Marked Count
  const markedCount = useMemo(() => {
    return filteredStudents.filter((s) => currentAttendance[s.id]).length;
  }, [filteredStudents, currentAttendance]);

  // Handle Sync to Google Sheet
  const handleSync = async () => {
    if (markedCount === 0) return;

    setIsSyncing(true);
    setSyncSuccess(false);
    setSyncError(null);

    const updates = filteredStudents
      .filter((s) => currentAttendance[s.id])
      .map((s) => ({
        rowIndex: s.rowIndex,
        rollNo: s.rollNo || s.id,
        name: s.name,
        batchYear: s.batchYear,
        mark: currentAttendance[s.id]
      }));

    const sessionObj = DEFAULT_SESSIONS.find((s) => s.code === selectedSession) || DEFAULT_SESSIONS[0];

    // Basic validation
    if (modulesList.length > 0 && !selectedModule) {
      setSyncError('Please select a Module Title');
      setTimeout(() => setSyncError(null), 3000);
      return;
    }
    if (tutorsList.length > 0 && !selectedTutor) {
      setSyncError('Please select a Module Tutor');
      setTimeout(() => setSyncError(null), 3000);
      return;
    }

    Logger.info(`Starting sync for ${activeSheet}, Session: ${selectedSession}, Marked: ${markedCount}`);
    const payload = {
      sheetName: activeSheet,
      date: effectiveDate,
      session: sessionObj.name,
      sessionCode: selectedSession,
      moduleTitle: selectedModule,
      moduleTutor: selectedTutor,
      updates
    };

    try {
      const targetUrl = scriptUrl || DEFAULT_APPS_SCRIPT_URL;
      await saveAttendanceToSheet(targetUrl, payload);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.85 }
        });
      } catch (e) {}

      Logger.info(`Sync successful for ${activeSheet}!`);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 4000);
    } catch (err) {
      Logger.error(`Sync failed for ${activeSheet}`, err.message);
      setSyncError(err.message || 'Failed to sync to Google Sheet');
      setTimeout(() => setSyncError(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="app-container">
      {/* Ambient Backdrop */}
      <div className="ambient-bg">
        <div className="ambient-blob-1" />
        <div className="ambient-blob-2" />
      </div>

      <div className="app-content">
        {/* Header */}
        <Header
          sheets={sheets}
          activeSheet={activeSheet}
          onSelectSheet={handleSelectSheet}
          isConnected={isConnected}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          isDev={isDev}
          selectedDate={effectiveDate}
          onSelectDate={handleSelectDate}
          availableDates={availableDates}
        />

                {/* Connection Status Handling */}
        {!isConnected && (
          <div className="glass-panel" style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "16px 20px", marginBottom: "20px", color: "var(--text-secondary)" }}>
            {isLoading || isConnecting ? (
              <>
                <Loader2 size={18} className="animate-spin" style={{ marginRight: "10px" }} />
                <span>Loading application data...</span>
              </>
            ) : (
              <>
                <AlertCircle size={18} style={{ marginRight: "10px", color: "#ef4444" }} />
                <span>Setup is not done or connection failed. Please visit your <a href="/admin" style={{ color: "var(--primary)", textDecoration: "underline" }}>Admin Dashboard</a> for this issue.</span>
              </>
            )}
          </div>
        )}

        {/* If Selected/Today Date is Saturday or Sunday -> Weekend Screen */}
        {isEffectiveWeekend ? (
          <WeekendHoliday dateFormatted={effectiveDateFormatted} />
        ) : (
          /* Weekday Attendance Flow */
          <main className="main-content">
            {/* Control Bar: Date + 3 Sessions + Batch Filter + Quick Actions */}
            <div className="glass-panel control-bar">
              {/* Left: Date Display & 3-Session Selector */}
              <div className="control-bar-left">
                <div className="date-indicator" title={isDev ? "Selected Date (Dev Mode)" : "Current Date (Locked to Today)"}>
                  <Calendar size={16} className="date-icon" />
                  <span>{effectiveDateFormatted}</span>
                </div>

                <div className="session-pill-group">
                  {DEFAULT_SESSIONS.map((sess) => (
                    <button
                      key={sess.code}
                      type="button"
                      className={`session-pill ${selectedSession === sess.code ? 'active' : ''}`}
                      onClick={() => setSelectedSession(sess.code)}
                      title={sess.name}
                    >
                      {sess.code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Batch Filter & Quick Actions */}
              <div className="control-bar-right">
                {batches.length > 0 && (
                  <div className="batch-select-wrapper">
                    <Filter size={14} className="batch-icon" />
                    <select
                      className="batch-select"
                      value={selectedBatch}
                      onChange={(e) => setSelectedBatch(e.target.value)}
                    >
                      {batches.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="batch-actions-group">
                  <button
                    type="button"
                    className="btn btn-outline btn-all-present"
                    onClick={handleMarkAllPresent}
                    title="Mark all filtered students Present"
                  >
                    <CheckCheck size={15} />
                    <span>All Present</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline btn-all-absent"
                    onClick={handleMarkAllAbsent}
                    title="Mark all filtered students Absent"
                  >
                    <XCircle size={15} />
                    <span>All Absent</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Helper Selectors (Module & Tutor) */}
            {isConnected && (modulesList.length > 0 || tutorsList.length > 0) && (
              <div className="glass-panel helpers-bar">
                <div className="helper-group">
                  <span className="helper-label">Module:</span>
                  <select 
                    className="helper-select"
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                  >
                    <option value="">-- Select Module --</option>
                    {modulesList.map((m, i) => <option key={i} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="helper-group">
                  <span className="helper-label">Tutor:</span>
                  <select 
                    className="helper-select"
                    value={selectedTutor}
                    onChange={(e) => setSelectedTutor(e.target.value)}
                  >
                    <option value="">-- Select Tutor --</option>
                    {tutorsList.map((t, i) => <option key={i} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Students Row-Based List */}
            <div className="glass-panel student-list-container">
              <div className="student-list-header">
                <span className="col-student-title">
                  Students ({filteredStudents.length})
                </span>
                <span className="col-actions-title">Attendance</span>
              </div>

              {isLoading ? (
                <div className="student-list-loading">
                  <Loader2 size={24} className="animate-spin" />
                  <span>Loading students from {activeSheet}...</span>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="student-list-empty">
                  <span>No students found. Ensure setup is completed in the Admin panel.</span>
                </div>
              ) : (
                <div className="student-rows-wrapper">
                  {filteredStudents.map((student) => (
                    <StudentRow
                      key={student.id}
                      student={student}
                      currentStatus={currentAttendance[student.id] || ''}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Floating Sync Bar */}
            {filteredStudents.length > 0 && (
              <div className="floating-sync-bar">
                <div className="sync-bar-info">
                  <span className="sync-bar-count">
                    <strong>{markedCount}</strong> of {filteredStudents.length} Marked
                  </span>
                  <span className="sync-bar-details">
                    {activeSheet} • {selectedSession} • {effectiveDate}
                  </span>
                </div>

                {syncSuccess && (
                  <div className="sync-status-msg success">
                    <CheckCircle2 size={16} />
                    <span>Synced to Google Sheet!</span>
                  </div>
                )}

                {syncError && (
                  <div className="sync-status-msg error">
                    <AlertCircle size={16} />
                    <span>{syncError}</span>
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn-sync-primary"
                  onClick={handleSync}
                  disabled={isSyncing || markedCount === 0 || (modulesList.length > 0 && !selectedModule) || (tutorsList.length > 0 && !selectedTutor)}
                >
                  {isSyncing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Sync Attendance to Sheet</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </main>
        )}
      </div>
    </div>
  );
}
