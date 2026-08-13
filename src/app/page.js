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
  AlertCircle 
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
  getTodayISODate 
} from '../lib/constants';
import { fetchSheetData, saveAttendanceToSheet } from '../lib/googleSheets';
import { ALL_DEPARTMENTS } from '../lib/gvizSheets';
import { MOCK_SHEETS, MOCK_STUDENTS } from '../lib/mockData';

export default function AttendancePage() {
  // Theme state
  const [theme, setTheme] = useState('dark');

  // Sheet & Department State
  const [sheets, setSheets] = useState(ALL_DEPARTMENTS);
  const [activeSheet, setActiveSheet] = useState('GT');
  const [isConnected, setIsConnected] = useState(true);

  // Student & Batch Data
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Session & Date State (Date is locked strictly to today)
  const todayISO = getTodayISODate();
  const todayFormatted = getFormattedToday();
  const isTodayWeekend = isWeekend();
  const [selectedSession, setSelectedSession] = useState(getSmartCurrentSession());

  // Attendance State { studentId: 'P' | 'A' | 'OD' }
  const [currentAttendance, setCurrentAttendance] = useState({});

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState(null);

  // Initialize theme
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
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
  const loadDepartmentData = async (sheetName) => {
    setIsLoading(true);
    const targetUrl = DEFAULT_SHEET_URL || DEFAULT_APPS_SCRIPT_URL;

    try {
      const data = await fetchSheetData(targetUrl, sheetName);
      if (data.success && data.data) {
        setIsConnected(true);
        setStudents(data.data.students || []);
        if (data.data.batches && data.data.batches.length > 0) {
          setBatches(data.data.batches);
        } else {
          setBatches(['IV', 'III', 'II', 'I']);
        }
      }
    } catch (err) {
      console.warn('Using local fallback data for', sheetName, err);
      const fallback = MOCK_STUDENTS[sheetName] || MOCK_STUDENTS['GT'] || [];
      setStudents(fallback);
      setBatches(['IV', 'III', 'II', 'I']);
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial sheet on mount
  useEffect(() => {
    loadDepartmentData(activeSheet);
  }, [activeSheet]);

  // Switch Department Tab
  const handleSelectSheet = (newSheet) => {
    setActiveSheet(newSheet);
    setCurrentAttendance({});
    setSelectedBatch('ALL');
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

    const payload = {
      sheetName: activeSheet,
      date: todayISO,
      session: sessionObj.name,
      sessionCode: selectedSession,
      updates
    };

    try {
      const targetUrl = DEFAULT_APPS_SCRIPT_URL || DEFAULT_SHEET_URL;
      await saveAttendanceToSheet(targetUrl, payload);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.85 }
        });
      } catch (e) {}

      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 4000);
    } catch (err) {
      console.error('Sync failed:', err);
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
        />

        {/* If Today is Saturday or Sunday -> Weekend Screen */}
        {isTodayWeekend ? (
          <WeekendHoliday />
        ) : (
          /* Weekday Attendance Flow */
          <main className="main-content">
            {/* Control Bar: Date + 3 Sessions + Batch Filter + Quick Actions */}
            <div className="glass-panel control-bar">
              {/* Left: Date Display & 3-Session Selector */}
              <div className="control-bar-left">
                <div className="date-indicator" title="Current Date (Locked to Today)">
                  <Calendar size={16} className="date-icon" />
                  <span>{todayFormatted}</span>
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
                      <option value="ALL">All Batches</option>
                      {batches.map((b) => (
                        <option key={b} value={b}>
                          Batch {b}
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
                  <span>No students found in this batch.</span>
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
                    {activeSheet} • {selectedSession} • {todayISO}
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
                  disabled={isSyncing || markedCount === 0}
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
