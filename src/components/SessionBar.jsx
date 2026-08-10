'use client';

import React from 'react';
import { Calendar, Layers, Clock, PlusCircle, History, Sparkles } from 'lucide-react';
import { DEFAULT_SESSIONS } from '../lib/constants';

export default function SessionBar({
  date,
  onChangeDate,
  session,
  onChangeSession,
  isNewSessionMode,
  onToggleSessionMode,
  existingSessions = [],
  selectedPastSession,
  onSelectPastSession,
  customSessionText,
  onChangeCustomSessionText
}) {
  return (
    <div className="glass-panel session-bar">
      <div className="session-controls">
        {/* Mode Switcher: New Session vs Edit Existing */}
        <div className="form-group">
          <label className="form-label">Mode</label>
          <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-input)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
            <button
              className={`btn btn-ghost ${isNewSessionMode ? 'btn-primary' : ''}`}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              onClick={() => onToggleSessionMode(true)}
            >
              <PlusCircle size={14} />
              <span>New Session</span>
            </button>
            <button
              className={`btn btn-ghost ${!isNewSessionMode ? 'btn-primary' : ''}`}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              onClick={() => onToggleSessionMode(false)}
              disabled={existingSessions.length === 0}
              title={existingSessions.length === 0 ? 'No past sessions recorded yet' : 'Edit a past session'}
            >
              <History size={14} />
              <span>Edit Past ({existingSessions.length})</span>
            </button>
          </div>
        </div>

        {isNewSessionMode ? (
          <>
            {/* Date Picker */}
            <div className="form-group">
              <label className="form-label">Attendance Date</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="date"
                  className="input-control"
                  value={date}
                  onChange={(e) => onChangeDate(e.target.value)}
                  style={{ minWidth: '160px' }}
                />
              </div>
            </div>

            {/* Session Preset / Custom Name */}
            <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
              <label className="form-label">Session / Period</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  className="input-control"
                  value={session}
                  onChange={(e) => onChangeSession(e.target.value)}
                  style={{ flex: 1 }}
                >
                  {DEFAULT_SESSIONS.map((sess) => (
                    <option key={sess} value={sess}>
                      {sess}
                    </option>
                  ))}
                  <option value="CUSTOM">✏️ Custom Session Name...</option>
                </select>

                {session === 'CUSTOM' && (
                  <input
                    type="text"
                    className="input-control"
                    placeholder="e.g. AI Workshop Part 1"
                    value={customSessionText}
                    onChange={(e) => onChangeCustomSessionText(e.target.value)}
                    style={{ flex: 1 }}
                  />
                )}
              </div>
            </div>
          </>
        ) : (
          /* Edit Past Session Picker */
          <div className="form-group" style={{ flex: 1, minWidth: '280px' }}>
            <label className="form-label">Select Past Session Column</label>
            <select
              className="input-control"
              value={selectedPastSession}
              onChange={(e) => onSelectPastSession(e.target.value)}
            >
              {existingSessions.map((s) => (
                <option key={s.header} value={s.header}>
                  Column {s.columnLetter}: {s.header}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Target Column Info Preview */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '0.2rem',
          padding: '0.4rem 0.8rem',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-color)'
        }}
      >
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
          Target Sheet Column
        </span>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
          {isNewSessionMode 
            ? `${date} - ${session === 'CUSTOM' ? (customSessionText || 'Custom') : session}`
            : selectedPastSession || 'None selected'
          }
        </span>
      </div>
    </div>
  );
}
