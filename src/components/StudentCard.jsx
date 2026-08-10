'use client';

import React from 'react';
import { Check, X, Clock, FileText, AlertTriangle } from 'lucide-react';
import { computeStudentCumulativeStats } from '../lib/googleSheets';

export default function StudentCard({
  student,
  currentStatus,
  onStatusChange,
  activeSessionHeader,
  isHighlighted = false
}) {
  const { id, rollNo, name, batchYear, history = {} } = student;
  
  // Calculate cumulative stats including current session mark
  const stats = computeStudentCumulativeStats(student, activeSessionHeader, currentStatus);

  // Get last 4 past history records
  const pastEntries = Object.entries(history).slice(-4);

  const getStatusClass = (code) => {
    switch (code) {
      case 'P': return 'marked-p';
      case 'A': return 'marked-a';
      case 'L': return 'marked-l';
      case 'OD': return 'marked-od';
      default: return '';
    }
  };

  const getInitials = (str) => {
    if (!str) return 'S';
    const parts = str.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div
      className={`glass-panel student-card ${getStatusClass(currentStatus)}`}
      style={isHighlighted ? { borderColor: 'var(--accent-primary)', transform: 'scale(1.02)', boxShadow: 'var(--shadow-floating)' } : {}}
    >
      {/* Student Details Header */}
      <div className="student-header">
        <div className="student-avatar">
          {getInitials(name)}
        </div>

        <div className="student-info">
          <div className="student-name" title={name}>
            {name}
          </div>
          <div className="student-id-row">
            <span className="student-id" title={`Roll No / S.No: ${rollNo || id}`}>
              #{rollNo || id}
            </span>
            {batchYear && batchYear !== 'General' && (
              <span className="student-id" style={{ color: '#a5b4fc', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
                {batchYear}
              </span>
            )}
            {stats.isDefaulter && (
              <span className="defaulter-badge" title="Attendance below 75%">
                ⚠️ &lt; 75%
              </span>
            )}
          </div>
        </div>

        <div className="overall-stats-pill" title={`Attended ${stats.attended} of ${stats.totalSessions} sessions`}>
          <span style={{ color: stats.percentage < 75 ? 'var(--status-absent-text)' : 'var(--status-present-text)' }}>
            {stats.percentage}%
          </span>
        </div>
      </div>

      {/* 4-Button Attendance Toggle Group */}
      <div className="status-btn-group">
        <button
          className={`status-btn ${currentStatus === 'P' ? 'active-p' : ''}`}
          onClick={() => onStatusChange(id, currentStatus === 'P' ? '' : 'P')}
          title="Mark Present (P)"
        >
          <Check size={16} />
          <span>Present</span>
        </button>

        <button
          className={`status-btn ${currentStatus === 'A' ? 'active-a' : ''}`}
          onClick={() => onStatusChange(id, currentStatus === 'A' ? '' : 'A')}
          title="Mark Absent (A)"
        >
          <X size={16} />
          <span>Absent</span>
        </button>

        <button
          className={`status-btn ${currentStatus === 'L' ? 'active-l' : ''}`}
          onClick={() => onStatusChange(id, currentStatus === 'L' ? '' : 'L')}
          title="Mark Late (L)"
        >
          <Clock size={16} />
          <span>Late</span>
        </button>

        <button
          className={`status-btn ${currentStatus === 'OD' ? 'active-od' : ''}`}
          onClick={() => onStatusChange(id, currentStatus === 'OD' ? '' : 'OD')}
          title="Mark On-Duty / Excused (OD)"
        >
          <FileText size={16} />
          <span>Excused</span>
        </button>
      </div>

      {/* Mini Past History Strip */}
      {pastEntries.length > 0 && (
        <div className="history-dots">
          <span className="history-label">Past:</span>
          {pastEntries.map(([sessName, mark], pIdx) => {
            const m = String(mark).toUpperCase();
            let bg = 'rgba(255, 255, 255, 0.1)';
            let color = 'var(--text-muted)';
            if (m === 'P') { bg = 'var(--status-present-bg)'; color = 'var(--status-present-text)'; }
            else if (m === 'A') { bg = 'var(--status-absent-bg)'; color = 'var(--status-absent-text)'; }
            else if (m === 'L') { bg = 'var(--status-late-bg)'; color = 'var(--status-late-text)'; }
            else if (m === 'OD') { bg = 'var(--status-excused-bg)'; color = 'var(--status-excused-text)'; }

            return (
              <div
                key={`hist_${id}_${sessName}_${pIdx}`}
                className="history-dot"
                style={{ background: bg, color: color }}
                title={`${sessName}: ${mark}`}
              >
                {mark || '-'}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
