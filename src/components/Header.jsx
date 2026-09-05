'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Sun, Moon, Layers, Calendar, LogOut, User, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  const { user, logout } = useAuth();

  return (
    <header className="glass-panel app-header">
      {/* Brand & Utilities (Top row on mobile, split on desktop) */}
      <div className="header-brand-row">
        <div className="header-brand">
          <div className="brand-icon brand-emblem-wrapper">
            <img src="/icat-emblem.png" alt="ICAT" className="brand-emblem-img" />
          </div>
          <div className="brand-text">
            <h1>ICAT-Attendance</h1>
            <span className="brand-subtitle">ICAT Design &amp; Media College</span>
          </div>
        </div>

        <div className="header-utilities">
          {/* Live Sheet Status Pill */}
          <div className="theme-status-pill" title={isConnected ? "Connected to Google Sheet" : "Offline"}>
            <span className={`status-dot ${isConnected ? 'online' : 'offline'}`} />
            <span className="status-label">{isConnected ? 'Connected' : 'Offline'}</span>
          </div>

          {/* User Profile Badge (if logged in) */}
          {user && (
            <div className="user-profile-badge" title={`Signed in as ${user.displayName || user.email} (${user.email})`}>
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
          )}

          {/* History Link Button */}
          <Link
            href="/history"
            className="btn-history-link"
            title="View Attendance History"
            aria-label="View Attendance History"
          >
            <History size={18} />
            <span className="history-btn-text">History</span>
          </Link>

          {/* Theme Toggle Button */}
          <button
            className="btn-theme-toggle"
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            type="button"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Sign Out Button (if logged in) */}
          {user && (
            <button
              className="btn-sign-out"
              onClick={logout}
              title={`Sign Out (${user.email})`}
              type="button"
              aria-label="Sign Out"
            >
              <LogOut size={18} />
            </button>
          )}
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
