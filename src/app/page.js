'use client';

import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import Header from '../components/Header';
import StatsOverview from '../components/StatsOverview';
import SessionBar from '../components/SessionBar';
import ActionBar from '../components/ActionBar';
import StudentList from '../components/StudentList';
import FloatingSyncBar from '../components/FloatingSyncBar';
import SetupGuideModal from '../components/SetupGuideModal';
import DefaultersModal from '../components/DefaultersModal';
import RandomStudentModal from '../components/RandomStudentModal';

import { 
  testConnection, 
  fetchSheetData, 
  saveAttendanceToSheet, 
  calculateStats,
  computeStudentCumulativeStats
} from '../lib/googleSheets';
import { MOCK_SHEETS, MOCK_STUDENTS, MOCK_SESSIONS } from '../lib/mockData';
import { DEFAULT_SESSIONS, STORAGE_KEYS, getSmartCurrentSession } from '../lib/constants';

export default function AttendancePage() {
  // Theme state
  const [theme, setTheme] = useState('dark');

  // Connection & Sheet State
  const [scriptUrl, setScriptUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isDemo, setIsDemo] = useState(true);
  const [sheets, setSheets] = useState(MOCK_SHEETS);
  const [activeSheet, setActiveSheet] = useState(MOCK_SHEETS[0]);
  const [students, setStudents] = useState(MOCK_STUDENTS[MOCK_SHEETS[0]] || []);
  const [existingSessions, setExistingSessions] = useState(MOCK_SESSIONS);
  const [batches, setBatches] = useState(['Year 1', 'Year 2', 'Year 3', 'Year 4']);
  const [selectedBatch, setSelectedBatch] = useState('ALL');

  // Column Mapping (Matches their sheet with Row 5 headers, Col A Roll No, Col B Name)
  const [columnMapping, setColumnMapping] = useState({
    headerRow: 5,
    idCol: 'A',
    nameCol: 'B'
  });

  // Session & Date State
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState(getTodayString());
  const [session, setSession] = useState(getSmartCurrentSession());
  const [customSessionText, setCustomSessionText] = useState('');
  const [isNewSessionMode, setIsNewSessionMode] = useState(true);
  const [selectedPastSession, setSelectedPastSession] = useState('');

  // Attendance Map: { [studentId]: 'P' | 'A' | 'L' | 'OD' }
  const [currentAttendance, setCurrentAttendance] = useState({});

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');

  // UI Modals & Loading
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isDefaultersOpen, setIsDefaultersOpen] = useState(false);
  const [randomStudent, setRandomStudent] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState(null);

  // Helper to filter department sheets from reports/helpers
  const filterDeptSheets = (allList = []) => {
    const depts = allList.filter(
      (s) =>
        !s.toLowerCase().includes('report') &&
        !s.toLowerCase().includes('helper') &&
        !s.toLowerCase().includes('list') &&
        !s.toLowerCase().includes('contact') &&
        !s.toLowerCase().includes('consolidated') &&
        !s.toLowerCase().includes('absentees')
    );
    return depts.length > 0 ? depts : allList;
  };

  // Load saved settings from LocalStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);

      const savedUrl = localStorage.getItem(STORAGE_KEYS.SCRIPT_URL);
      if (savedUrl) {
        setScriptUrl(savedUrl);
        loadLiveData(savedUrl);
      } else {
        setIsDemo(true);
        setIsConnected(false);
      }

      const savedColMap = localStorage.getItem(STORAGE_KEYS.COLUMN_MAPPING);
      if (savedColMap) {
        setColumnMapping(JSON.parse(savedColMap));
      }
    } catch (e) {
      console.error('Error reading localStorage:', e);
    }
  }, []);

  // Theme Toggle
  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, nextTheme);
    } catch (e) {}
  };

  // Load Live Google Sheet Data
  const loadLiveData = async (url, sheetName = '') => {
    try {
      const data = await fetchSheetData(url, sheetName, columnMapping);
      if (data.success && data.data) {
        setIsConnected(true);
        setIsDemo(false);
        const depts = filterDeptSheets(data.sheets || [data.sheetName]);
        setSheets(depts);
        const targetSheet = sheetName || data.sheetName || depts[0];
        setActiveSheet(targetSheet);
        setStudents(data.data.students || []);
        setExistingSessions(data.data.sessions || []);
        if (data.data.batches && data.data.batches.length > 0) {
          setBatches(data.data.batches);
        }
        if (data.data.sessions && data.data.sessions.length > 0) {
          setSelectedPastSession(data.data.sessions[data.data.sessions.length - 1].header);
        }
      }
    } catch (err) {
      console.warn('Could not auto-load live sheet data, keeping demo mode:', err);
    }
  };

  // Switch Sheet Tab
  const handleSelectSheet = async (newSheet) => {
    setActiveSheet(newSheet);
    setCurrentAttendance({});
    setSelectedBatch('ALL');

    if (isConnected && scriptUrl) {
      try {
        const data = await fetchSheetData(scriptUrl, newSheet, columnMapping);
        if (data.success && data.data) {
          setStudents(data.data.students || []);
          setExistingSessions(data.data.sessions || []);
          if (data.data.batches) setBatches(data.data.batches);
          if (data.data.sessions && data.data.sessions.length > 0) {
            setSelectedPastSession(data.data.sessions[data.data.sessions.length - 1].header);
          }
        }
      } catch (err) {
        console.error('Error switching live sheet:', err);
      }
    } else {
      const mockList = MOCK_STUDENTS[newSheet] || [];
      setStudents(mockList);
    }
  };

  // Compute active target session column header
  const targetSessionHeader = useMemo(() => {
    if (isNewSessionMode) {
      const sessName = session === 'CUSTOM' ? (customSessionText || 'Custom Session') : session;
      return `${date} - ${sessName}`;
    }
    return selectedPastSession || 'Select Past Session';
  }, [isNewSessionMode, date, session, customSessionText, selectedPastSession]);

  // When selecting past session, populate currentAttendance from history
  const handleSelectPastSession = (header) => {
    setSelectedPastSession(header);
    const newAtt = {};
    students.forEach((s) => {
      if (s.history && s.history[header]) {
        newAtt[s.id] = s.history[header];
      }
    });
    setCurrentAttendance(newAtt);
  };

  const handleToggleSessionMode = (isNew) => {
    setIsNewSessionMode(isNew);
    if (!isNew && existingSessions.length > 0) {
      const header = selectedPastSession || existingSessions[existingSessions.length - 1].header;
      handleSelectPastSession(header);
    } else {
      setCurrentAttendance({});
    }
  };

  // Handle marking status for single student
  const handleStatusChange = (studentId, status) => {
    setCurrentAttendance((prev) => ({
      ...prev,
      [studentId]: status
    }));
  };

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    let list = [...students];

    // Batch Year filter
    if (selectedBatch !== 'ALL') {
      list = list.filter((s) => s.batchYear === selectedBatch);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.rollNo && String(s.rollNo).toLowerCase().includes(q)) ||
          s.id.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (activeFilter === 'P') {
      list = list.filter((s) => currentAttendance[s.id] === 'P');
    } else if (activeFilter === 'A') {
      list = list.filter((s) => currentAttendance[s.id] === 'A');
    } else if (activeFilter === 'LATE_OD') {
      list = list.filter(
        (s) => currentAttendance[s.id] === 'L' || currentAttendance[s.id] === 'OD'
      );
    } else if (activeFilter === 'UNMARKED') {
      list = list.filter((s) => !currentAttendance[s.id]);
    }

    return list;
  }, [students, selectedBatch, searchQuery, activeFilter, currentAttendance]);

  // Batch actions
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

  const handleInvertAttendance = () => {
    const updated = { ...currentAttendance };
    filteredStudents.forEach((s) => {
      const current = currentAttendance[s.id];
      if (current === 'P') updated[s.id] = 'A';
      else if (current === 'A') updated[s.id] = 'P';
      else updated[s.id] = 'P';
    });
    setCurrentAttendance(updated);
  };

  const handleClearAttendance = () => {
    setCurrentAttendance({});
  };

  // Random Student Callout Picker
  const handleRandomStudent = () => {
    if (filteredStudents.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredStudents.length);
    setRandomStudent(filteredStudents[randomIndex]);
  };

  // Test Connection to Google Sheet Web App
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testConnection(scriptUrl);
      setTestResult(res);
      if (res.success) {
        setIsConnected(true);
        setIsDemo(false);
        try {
          localStorage.setItem(STORAGE_KEYS.SCRIPT_URL, scriptUrl);
          localStorage.setItem(STORAGE_KEYS.COLUMN_MAPPING, JSON.stringify(columnMapping));
        } catch (e) {}
        
        // Load the live data
        await loadLiveData(scriptUrl);

        // Close setup modal after brief success feedback
        setTimeout(() => {
          setIsSetupOpen(false);
        }, 1200);
      }
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  // Switch to Demo Mode
  const handleUseDemoMode = () => {
    setIsConnected(false);
    setIsDemo(true);
    setSheets(MOCK_SHEETS);
    setActiveSheet(MOCK_SHEETS[0]);
    setStudents(MOCK_STUDENTS[MOCK_SHEETS[0]] || []);
    setExistingSessions(MOCK_SESSIONS);
    setIsSetupOpen(false);
  };

  // Sync / Save Attendance to Google Sheet
  const handleSync = async () => {
    setIsSyncing(true);
    setSyncSuccess(false);
    setSyncError(null);

    const updates = filteredStudents
      .filter((s) => currentAttendance[s.id])
      .map((s) => ({
        rowIndex: s.rowIndex,
        rollNo: s.rollNo || s.id,
        name: s.name,
        mark: currentAttendance[s.id]
      }));

    const payload = {
      sheetName: activeSheet,
      date,
      session: session === 'CUSTOM' ? customSessionText : session,
      sessionHeader: targetSessionHeader,
      attendance: currentAttendance,
      updates,
      headerRow: columnMapping.headerRow || 5,
      idCol: columnMapping.idCol || 'A',
      nameCol: columnMapping.nameCol || 'B'
    };

    try {
      if (isDemo || !isConnected) {
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Update local mock history
        setStudents((prev) =>
          prev.map((s) => ({
            ...s,
            history: {
              ...s.history,
              [targetSessionHeader]: currentAttendance[s.id] || ''
            }
          }))
        );

        if (!existingSessions.some((s) => s.header === targetSessionHeader)) {
          setExistingSessions((prev) => [
            ...prev,
            { columnIndex: prev.length + 7, columnLetter: 'H', header: targetSessionHeader }
          ]);
        }
      } else {
        const result = await saveAttendanceToSheet(scriptUrl, payload);
        if (!result.success) {
          throw new Error(result.error || 'Failed to save attendance');
        }

        await loadLiveData(scriptUrl, activeSheet);
      }

      try {
        confetti({
          particleCount: 90,
          spread: 80,
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

  // Live Statistics calculation
  const stats = useMemo(() => {
    return calculateStats(filteredStudents, currentAttendance);
  }, [filteredStudents, currentAttendance]);

  // Defaulter count
  const defaulterCount = useMemo(() => {
    return students.filter((s) => {
      const cs = computeStudentCumulativeStats(s, targetSessionHeader, currentAttendance[s.id]);
      return cs.isDefaulter || (cs.percentage < 75 && cs.totalSessions > 0);
    }).length;
  }, [students, targetSessionHeader, currentAttendance]);

  const markedCount = Object.keys(currentAttendance).filter((k) => currentAttendance[k]).length;

  return (
    <div className="app-container">
      {/* Header */}
      <Header
        isConnected={isConnected}
        isDemo={isDemo}
        sheets={sheets}
        activeSheet={activeSheet}
        onSelectSheet={handleSelectSheet}
        onOpenSetup={() => setIsSetupOpen(true)}
        onOpenDefaulters={() => setIsDefaultersOpen(true)}
        defaulterCount={defaulterCount}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Real-Time Stats Overview */}
      <StatsOverview stats={stats} />

      {/* Session & Date Bar */}
      <SessionBar
        date={date}
        onChangeDate={setDate}
        session={session}
        onChangeSession={setSession}
        isNewSessionMode={isNewSessionMode}
        onToggleSessionMode={handleToggleSessionMode}
        existingSessions={existingSessions}
        selectedPastSession={selectedPastSession}
        onSelectPastSession={handleSelectPastSession}
        customSessionText={customSessionText}
        onChangeCustomSessionText={setCustomSessionText}
      />

      {/* Quick Action Toolbar (Search, Batch Year, Filter, Batch Mark) */}
      <ActionBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        filterCounts={{
          total: students.length,
          present: stats.present,
          absent: stats.absent,
          late: stats.late,
          excused: stats.excused,
          unmarked: stats.unmarked
        }}
        batches={batches}
        selectedBatch={selectedBatch}
        onSelectBatch={setSelectedBatch}
        onMarkAllPresent={handleMarkAllPresent}
        onMarkAllAbsent={handleMarkAllAbsent}
        onInvertAttendance={handleInvertAttendance}
        onClearAttendance={handleClearAttendance}
        onRandomStudent={handleRandomStudent}
      />

      {/* Student Cards Grid */}
      <StudentList
        students={filteredStudents}
        currentAttendance={currentAttendance}
        onStatusChange={handleStatusChange}
        activeSessionHeader={targetSessionHeader}
        highlightedStudentId={randomStudent ? randomStudent.id : null}
      />

      {/* Floating Bottom Sync Action Bar */}
      <FloatingSyncBar
        isSyncing={isSyncing}
        syncSuccess={syncSuccess}
        syncError={syncError}
        onSync={handleSync}
        totalStudents={filteredStudents.length}
        markedCount={markedCount}
        activeSheet={activeSheet}
        targetSessionHeader={targetSessionHeader}
        isDemo={isDemo}
      />

      {/* Setup Guide Modal */}
      <SetupGuideModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        scriptUrl={scriptUrl}
        onChangeScriptUrl={setScriptUrl}
        onTestConnection={handleTestConnection}
        isTesting={isTesting}
        testResult={testResult}
        columnMapping={columnMapping}
        onChangeColumnMapping={setColumnMapping}
        onUseDemoMode={handleUseDemoMode}
      />

      {/* Defaulters Modal */}
      <DefaultersModal
        isOpen={isDefaultersOpen}
        onClose={() => setIsDefaultersOpen(false)}
        students={students}
        activeSessionHeader={targetSessionHeader}
        currentAttendance={currentAttendance}
      />

      {/* Random Student Modal */}
      <RandomStudentModal
        isOpen={!!randomStudent}
        onClose={() => setRandomStudent(null)}
        student={randomStudent}
        currentStatus={randomStudent ? currentAttendance[randomStudent.id] : ''}
        onMarkStatus={handleStatusChange}
        onSpinAgain={handleRandomStudent}
      />
    </div>
  );
}
