'use client';

import React from 'react';
import { 
  Sparkles, 
  Link as LinkIcon, 
  Settings, 
  Sun, 
  Moon, 
  AlertTriangle, 
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

export default function Header({
  isConnected,
  isDemo,
  sheets = [],
  activeSheet,
  onSelectSheet,
  onOpenSetup,
  onOpenDefaulters,
  defaulterCount = 0,
  theme,
  onToggleTheme
}) {
  return (
    <header className="glass-panel app-header">
      <div className="brand-section">
        <div className="brand-logo">
          <Sparkles size={24} />
        </div>
        <div>
          <h1 className="brand-title">AutoAttendance</h1>
          <p className="brand-subtitle">Smart Google Sheets Automation</p>
        </div>
      </div>

      <div className="header-actions">
        {/* Active Sheet Selector */}
        {sheets.length > 0 && (
          <div className="form-group" style={{ minWidth: '180px' }}>
            <select
              className="input-control"
              value={activeSheet}
              onChange={(e) => onSelectSheet(e.target.value)}
              title="Select Class / Sheet Tab"
            >
              {sheets.map((s) => (
                <option key={s} value={s}>
                  📄 {s}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Connection Status Pill */}
        <button
          className="status-pill"
          onClick={onOpenSetup}
          title="Click to configure Google Sheet connection"
        >
          <span className={`status-dot ${isConnected ? 'connected' : isDemo ? 'demo' : ''}`} />
          <span>
            {isConnected ? 'Live Google Sheet' : isDemo ? 'Demo Mode' : 'Not Connected'}
          </span>
          <Settings size={14} style={{ marginLeft: '4px', color: 'var(--text-muted)' }} />
        </button>

        {/* Defaulter Alert Button */}
        {defaulterCount > 0 && (
          <button
            className="btn btn-secondary"
            onClick={onOpenDefaulters}
            style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
            title="View students with attendance below 75%"
          >
            <AlertTriangle size={16} />
            <span>{defaulterCount} Defaulters</span>
          </button>
        )}

        {/* Setup / Connect Button */}
        <button className="btn btn-primary" onClick={onOpenSetup}>
          <LinkIcon size={16} />
          <span>{isConnected ? 'Connected Sheet' : 'Connect Sheet'}</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          className="btn btn-secondary btn-icon"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
