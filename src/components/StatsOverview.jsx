'use client';

import React from 'react';
import { Users, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function StatsOverview({ stats }) {
  const { total, present, absent, late, excused, percentage } = stats;

  const presentWidth = total > 0 ? (present / total) * 100 : 0;
  const lateWidth = total > 0 ? ((late + excused) / total) * 100 : 0;
  const absentWidth = total > 0 ? (absent / total) * 100 : 0;

  return (
    <div className="stats-container">
      {/* Total Students */}
      <div className="glass-panel stat-card" style={{ color: 'var(--accent-primary)' }}>
        <div className="stat-info">
          <span className="stat-label">Total Students</span>
          <span className="stat-value">{total}</span>
          <span className="stat-sub">Enrolled in Class</span>
        </div>
        <div className="stat-icon-wrapper" style={{ color: 'var(--accent-primary)' }}>
          <Users size={24} />
        </div>
      </div>

      {/* Present Students */}
      <div className="glass-panel stat-card" style={{ color: 'var(--status-present)' }}>
        <div className="stat-info">
          <span className="stat-label">Present</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span className="stat-value" style={{ color: 'var(--status-present-text)' }}>
              {present}
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--status-present-text)' }}>
              ({percentage}%)
            </span>
          </div>
          <span className="stat-sub">Attending Today</span>
        </div>
        <div className="stat-icon-wrapper" style={{ color: 'var(--status-present-text)' }}>
          <CheckCircle2 size={24} />
        </div>
      </div>

      {/* Absent Students */}
      <div className="glass-panel stat-card" style={{ color: 'var(--status-absent)' }}>
        <div className="stat-info">
          <span className="stat-label">Absent</span>
          <span className="stat-value" style={{ color: 'var(--status-absent-text)' }}>
            {absent}
          </span>
          <span className="stat-sub">Unexcused</span>
        </div>
        <div className="stat-icon-wrapper" style={{ color: 'var(--status-absent-text)' }}>
          <XCircle size={24} />
        </div>
      </div>

      {/* Late / Excused */}
      <div className="glass-panel stat-card" style={{ color: 'var(--status-late)' }}>
        <div className="stat-info">
          <span className="stat-label">Late / OD</span>
          <span className="stat-value" style={{ color: 'var(--status-late-text)' }}>
            {late + excused}
          </span>
          <span className="stat-sub">{late} Late • {excused} Excused</span>
        </div>
        <div className="stat-icon-wrapper" style={{ color: 'var(--status-late-text)' }}>
          <Clock size={24} />
        </div>
      </div>

      {/* Progress Strip spanning across */}
      <div style={{ gridColumn: '1 / -1' }}>
        <div className="progress-strip">
          <div className="progress-fill-present" style={{ width: `${presentWidth}%` }} title={`Present: ${present}`} />
          <div className="progress-fill-late" style={{ width: `${lateWidth}%` }} title={`Late/OD: ${late + excused}`} />
          <div className="progress-fill-absent" style={{ width: `${absentWidth}%` }} title={`Absent: ${absent}`} />
        </div>
      </div>
    </div>
  );
}
