'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  BookOpen, 
  Layers, 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Filter, 
  Search, 
  RotateCw, 
  Sun, 
  Moon, 
  LogOut, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  Loader2
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import LoginScreen from '../../components/LoginScreen';
import { fetchCurrentMonthHistory } from '../../lib/firestoreHistory';
import { ALL_DEPARTMENTS } from '../../lib/gvizSheets';
import { STORAGE_KEYS } from '../../lib/constants';

export default function HistoryClient() {
  const { user, loading: authLoading, logout } = useAuth();

  // Theme state
  const [theme, setTheme] = useState('dark');
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

  // History State
  const [historyList, setHistoryList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Filters State
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCardId, setExpandedCardId] = useState(null);

  // Load History from Firestore
  const loadHistory = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchCurrentMonthHistory();
      setHistoryList(data);
    } catch (err) {
      console.error('Error fetching attendance history:', err);
      setLoadError(err.message || 'Failed to load attendance history from Firestore.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  // Derived Filtered List
  const filteredHistory = useMemo(() => {
    return historyList.filter((item) => {
      // Department Filter
      if (departmentFilter !== 'ALL' && item.department !== departmentFilter) {
        return false;
      }

      // Search Query Filter (Teacher, Module, Batch, Tutor, Date)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const teacherMatch = (item.teacherName || '').toLowerCase().includes(q) || (item.teacherEmail || '').toLowerCase().includes(q);
        const moduleMatch = (item.module || '').toLowerCase().includes(q);
        const batchMatch = (item.batch || '').toLowerCase().includes(q);
        const tutorMatch = (item.moduleTutor || '').toLowerCase().includes(q);
        const dateMatch = (item.date || '').toLowerCase().includes(q);
        return teacherMatch || moduleMatch || batchMatch || tutorMatch || dateMatch;
      }

      return true;
    });
  }, [historyList, departmentFilter, searchQuery]);

  // Current Month Label for user
  const currentMonthName = useMemo(() => {
    return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  }, []);

  const toggleExpandCard = (id) => {
    setExpandedCardId((prev) => (prev === id ? null : id));
  };

  // Auth Gate
  if (authLoading) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)' }}>
          <Loader2 size={36} className="spin" style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Authenticating session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-container" data-theme={theme}>
        <LoginScreen />
      </div>
    );
  }

  return (
    <div className="app-container" data-theme={theme}>
      {/* Ambient Backdrop */}
      <div className="ambient-bg">
        <div className="ambient-blob-1" />
        <div className="ambient-blob-2" />
      </div>

      <div className="app-content history-page-content">
        {/* Navigation Header */}
        <header className="glass-panel history-header">
          <div className="history-header-left">
            <Link href="/" className="btn-back-link" title="Return to Attendance Taking">
              <ArrowLeft size={16} />
              <span>Back to Attendance</span>
            </Link>

            <div className="history-brand-title">
              <div className="brand-icon brand-emblem-wrapper">
                <img src="/icat-emblem.png" alt="ICAT" className="brand-emblem-img" />
              </div>
              <div>
                <h1>Attendance History</h1>
                <span className="history-subtitle">
                  Showing records for <strong>{currentMonthName}</strong> (Auto-purged monthly)
                </span>
              </div>
            </div>
          </div>

          <div className="header-utilities">
            {/* User Profile Badge */}
            <div className="user-profile-badge" title={`Signed in as ${user.displayName || user.email}`}>
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="user-avatar" referrerPolicy="no-referrer" />
              ) : (
                <div className="user-avatar-placeholder">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="user-name-text">
                {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
              </span>
            </div>

            {/* Refresh Button */}
            <button
              className="btn-sync-refresh"
              onClick={loadHistory}
              disabled={isLoading}
              title="Refresh from Firestore Database"
              type="button"
            >
              <RotateCw size={16} className={isLoading ? 'spin' : ''} />
            </button>

            {/* Theme Toggle Button */}
            <button
              className="btn-theme-toggle"
              onClick={handleToggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              type="button"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Sign Out Button */}
            <button
              className="btn-sign-out"
              onClick={logout}
              title={`Sign Out (${user.email})`}
              type="button"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Filter Controls Bar */}
        <section className="glass-panel history-filter-bar">
          <div className="history-filter-group">
            {/* Department Dropdown */}
            <div className="dept-dropdown-wrapper" title="Filter by Department">
              <Layers size={15} className="dept-icon" />
              <select
                className="dept-select"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="ALL">All Departments</option>
                {ALL_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    Department: {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="history-search-wrapper">
              <Search size={15} className="history-search-icon" />
              <input
                type="text"
                placeholder="Search teacher, module, batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="history-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="history-search-clear"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Records Counter Pill */}
          <div className="history-stats-pill">
            <span>{filteredHistory.length} Session{filteredHistory.length !== 1 ? 's' : ''} Logged</span>
          </div>
        </section>

        {/* Main Content Area */}
        <main className="history-list-section">
          {isLoading ? (
            <div className="glass-panel history-loading-state">
              <Loader2 size={32} className="spin" style={{ color: 'var(--accent-primary)' }} />
              <span>Fetching live attendance records from Cloud Firestore...</span>
            </div>
          ) : loadError ? (
            <div className="glass-panel history-error-state">
              <AlertCircle size={32} color="#ef4444" />
              <h3>Failed to Load History</h3>
              <p>{loadError}</p>
              <button type="button" onClick={loadHistory} className="btn btn-outline" style={{ marginTop: '1rem' }}>
                <RotateCw size={15} /> Try Again
              </button>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="glass-panel history-empty-state">
              <Calendar size={44} style={{ opacity: 0.35, color: 'var(--accent-primary)' }} />
              <h3>No Attendance Records Found</h3>
              <p>
                {historyList.length === 0 
                  ? `No attendance sessions have been synced yet for ${currentMonthName}. Once a teacher marks attendance, records will appear here in real time.`
                  : 'No records matched your current department or search filter.'}
              </p>
              <Link href="/" className="btn btn-sync-primary" style={{ marginTop: '1rem', textDecoration: 'none' }}>
                Mark Attendance Now
              </Link>
            </div>
          ) : (
            <div className="history-cards-grid">
              {filteredHistory.map((item) => {
                const isExpanded = expandedCardId === item.id;
                const total = item.totalMarked || (item.presentCount + item.absentCount + item.odCount) || 1;
                const presentPercent = Math.round(((item.presentCount || 0) / total) * 100);

                return (
                  <article key={item.id} className="glass-panel history-card">
                    {/* Top Row: Date, Session Code, and Sync Time */}
                    <div className="history-card-header">
                      <div className="history-date-badge">
                        <Calendar size={14} />
                        <span>{item.date}</span>
                        <span className="history-session-tag">{item.session}</span>
                      </div>

                      {item.syncTime && (
                        <div className="history-time-badge" title="Timestamp recorded in Firestore">
                          <Clock size={13} />
                          <span>{item.syncTime}</span>
                        </div>
                      )}
                    </div>

                    {/* Teacher Row (From Google Account, NOT Module Tutor) */}
                    <div className="history-teacher-row">
                      <div className="history-teacher-avatar">
                        {item.teacherPhoto ? (
                          <img src={item.teacherPhoto} alt={item.teacherName} referrerPolicy="no-referrer" />
                        ) : (
                          <div className="history-avatar-placeholder">
                            {(item.teacherName || 'T')[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="history-teacher-meta">
                        <div className="history-teacher-name-group">
                          <span className="history-teacher-name">{item.teacherName}</span>
                          <span className="history-teacher-badge">Faculty In-Charge</span>
                        </div>
                        <span className="history-teacher-email">{item.teacherEmail}</span>
                      </div>
                    </div>

                    {/* Academic Information Grid */}
                    <div className="history-academic-grid">
                      {/* Module */}
                      <div className="history-info-cell">
                        <span className="info-cell-label">
                          <BookOpen size={13} /> Module Taught
                        </span>
                        <span className="info-cell-value" title={item.module}>
                          {item.module || 'Not Specified'}
                        </span>
                      </div>

                      {/* Department & Batch */}
                      <div className="history-info-cell">
                        <span className="info-cell-label">
                          <Layers size={13} /> Department &amp; Batch
                        </span>
                        <div className="info-cell-badges">
                          <span className="badge-dept">{item.department}</span>
                          <span className="badge-batch">{item.batch || 'ALL'}</span>
                        </div>
                      </div>

                      {/* Module Tutor */}
                      <div className="history-info-cell">
                        <span className="info-cell-label">
                          <UserCheck size={13} /> Module Tutor
                        </span>
                        <span className="info-cell-value" title={item.moduleTutor}>
                          {item.moduleTutor || 'Unassigned'}
                        </span>
                      </div>
                    </div>

                    {/* Attendance Stats Row */}
                    <div className="history-stats-bar">
                      <div className="stat-pill present" title="Present Students">
                        <CheckCircle2 size={13} />
                        <span>Present: <strong>{item.presentCount || 0}</strong></span>
                      </div>
                      <div className="stat-pill absent" title="Absent Students">
                        <XCircle size={13} />
                        <span>Absent: <strong>{item.absentCount || 0}</strong></span>
                      </div>
                      <div className="stat-pill od" title="On-Duty Students">
                        <FileText size={13} />
                        <span>OD: <strong>{item.odCount || 0}</strong></span>
                      </div>
                      <div className="stat-pill rate" title="Attendance Percentage">
                        <span>{presentPercent}% Present</span>
                      </div>
                    </div>

                    {/* Collapsible Student List Toggle (Read-Only) */}
                    {item.studentRecords && item.studentRecords.length > 0 && (
                      <div className="history-expand-wrapper">
                        <button
                          type="button"
                          className="btn-history-expand"
                          onClick={() => toggleExpandCard(item.id)}
                        >
                          <span>{isExpanded ? 'Hide' : 'View'} Student Roster ({item.studentRecords.length})</span>
                          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>

                        {isExpanded && (
                          <div className="history-roster-table-wrapper">
                            <table className="history-roster-table">
                              <thead>
                                <tr>
                                  <th>Roll</th>
                                  <th>Student Name</th>
                                  <th>Batch</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {item.studentRecords.map((s, idx) => (
                                  <tr key={idx} className={`roster-row-${(s.mark || '').toLowerCase()}`}>
                                    <td className="roster-roll">{s.roll || idx + 1}</td>
                                    <td className="roster-name">{s.name}</td>
                                    <td className="roster-batch">{s.batch || item.batch}</td>
                                    <td className="roster-status">
                                      <span className={`roster-status-tag tag-${(s.mark || '').toLowerCase()}`}>
                                        {s.mark === 'P' ? 'Present' : s.mark === 'A' ? 'Absent' : s.mark === 'OD' ? 'On-Duty' : s.mark}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
