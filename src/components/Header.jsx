'use client';

import React from 'react';
import { Sparkles, Sun, Moon, Layers, FileText, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function Header({
  sheets = [],
  activeSheet = '',
  onSelectSheet,
  isConnected = true,
  theme = 'dark',
  onToggleTheme,
  isDev = false,
  selectedDate = '',
  onSelectDate,
  availableDates = []
}) {
  return (
    <header className="glass-panel app-header">
      {/* Brand & Utilities (Top row on mobile, split on desktop) */}
      <div className="header-brand-row">
        <div className="header-brand">
          <div className="brand-icon">
            <Sparkles size={20} className="brand-sparkle" />
          </div>
          <div className="brand-text">
            <h1>AutoAttendance</h1>
            <span className="brand-subtitle">Automated Attendance System</span>
          </div>
        </div>

        <div className="header-utilities">
          {/* Live Sheet Status Pill */}
          <div className="theme-status-pill" title={isConnected ? "Connected to Google Sheet" : "Offline"}>
            <span className={`status-dot ${isConnected ? 'online' : 'offline'}`} />
            <span className="status-label">{isConnected ? 'Connected' : 'Offline'}</span>
          </div>

          <Link href="/log" className="btn-theme-toggle" title="System Logs" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={17} />
          </Link>

          {/* Theme Toggle Button */}
          <button
            className="btn-theme-toggle"
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            type="button"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>

      {/* Selectors Row (Full width on mobile, right-aligned on desktop) */}
      <div className="header-selectors">
        {/* Dev Mode Date Selector (Shown only in dev mode) */}
        {isDev && availableDates.length > 0 && (
          <div className="dept-dropdown-wrapper dev-date-wrapper" title="Dev Mode: Select Date">
            <Calendar size={15} className="dept-icon dev-date-icon" />
            <select
              className="dept-select dev-date-select"
              value={selectedDate}
              onChange={(e) => onSelectDate && onSelectDate(e.target.value)}
              title="Dev Mode Date Selector"
            >
              {availableDates.map((item) => (
                <option key={item.iso} value={item.iso}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Department Switcher */}
        {sheets.length > 0 && (
          <div className="dept-dropdown-wrapper" title="Select Department Sheet">
            <Layers size={15} className="dept-icon" />
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
      </div>
    </header>
  );
}
