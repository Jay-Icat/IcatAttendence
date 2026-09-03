'use client';

import React from 'react';
import { Sparkles, Sun, Moon, Layers, FileText } from 'lucide-react';
import Link from 'next/link';

export default function Header({
  sheets = [],
  activeSheet = '',
  onSelectSheet,
  isConnected = true,
  theme = 'dark',
  onToggleTheme
}) {
  return (
    <header className="glass-panel app-header">
      {/* App Branding */}
      <div className="header-brand">
        <div className="brand-icon">
          <Sparkles size={20} className="brand-sparkle" />
        </div>
        <div className="brand-text">
          <h1>AutoAttendance</h1>
          <span className="brand-subtitle">Automated Attendance System</span>
        </div>
      </div>

      {/* Header Actions */}
      <div className="header-actions">
        {/* Department Switcher */}
        {sheets.length > 0 && (
          <div className="dept-dropdown-wrapper">
            <Layers size={16} className="dept-icon" />
            <select
              className="dept-select"
              value={activeSheet}
              onChange={(e) => onSelectSheet(e.target.value)}
              title="Select Department Sheet"
            >
              {sheets.map((s) => (
                <option key={s} value={s}>
                  Department: {s}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Live Sheet Status Pill (Obeys dark/light theme) */}
        <div className="theme-status-pill" title={isConnected ? "Connected to Google Sheet" : "Offline"}>
          <span className={`status-dot ${isConnected ? 'online' : 'offline'}`} />
          <span className="status-label">{isConnected ? 'Connected' : 'Offline'}</span>
        </div>

        <Link href="/log" className="btn-theme-toggle" title="System Logs" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText size={18} />
        </Link>

        {/* Theme Toggle Button */}
        <button
          className="btn-theme-toggle"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
