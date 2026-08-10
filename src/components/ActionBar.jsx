'use client';

import React from 'react';
import { 
  Search, 
  CheckCheck, 
  XSquare, 
  Shuffle, 
  RotateCcw, 
  Dice5,
  GraduationCap
} from 'lucide-react';

export default function ActionBar({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  filterCounts = {},
  batches = [],
  selectedBatch = 'ALL',
  onSelectBatch,
  onMarkAllPresent,
  onMarkAllAbsent,
  onInvertAttendance,
  onClearAttendance,
  onRandomStudent
}) {
  return (
    <div className="glass-panel action-bar">
      {/* Search Input & Batch Year Filter */}
      <div style={{ display: 'flex', gap: '0.65rem', flex: 1, flexWrap: 'wrap', minWidth: '260px' }}>
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="input-control search-input"
            placeholder="Search by student name or roll no..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Batch Year Dropdown Filter if available */}
        {batches.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <select
              className="input-control"
              value={selectedBatch}
              onChange={(e) => onSelectBatch(e.target.value)}
              title="Filter by Batch / Year"
              style={{ minWidth: '130px' }}
            >
              <option value="ALL">🎓 All Batches</option>
              {batches.map((b) => (
                <option key={b} value={b}>
                  Batch {b}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Filter Status Chips */}
      <div className="filter-group">
        <button
          className={`filter-chip ${activeFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => onFilterChange('ALL')}
        >
          All ({filterCounts.total || 0})
        </button>
        <button
          className={`filter-chip ${activeFilter === 'P' ? 'active' : ''}`}
          onClick={() => onFilterChange('P')}
          style={activeFilter === 'P' ? { background: 'var(--status-present)', borderColor: 'var(--status-present)' } : {}}
        >
          Present ({filterCounts.present || 0})
        </button>
        <button
          className={`filter-chip ${activeFilter === 'A' ? 'active' : ''}`}
          onClick={() => onFilterChange('A')}
          style={activeFilter === 'A' ? { background: 'var(--status-absent)', borderColor: 'var(--status-absent)' } : {}}
        >
          Absent ({filterCounts.absent || 0})
        </button>
        <button
          className={`filter-chip ${activeFilter === 'LATE_OD' ? 'active' : ''}`}
          onClick={() => onFilterChange('LATE_OD')}
          style={activeFilter === 'LATE_OD' ? { background: 'var(--status-late)', borderColor: 'var(--status-late)' } : {}}
        >
          Late / OD ({(filterCounts.late || 0) + (filterCounts.excused || 0)})
        </button>
        <button
          className={`filter-chip ${activeFilter === 'UNMARKED' ? 'active' : ''}`}
          onClick={() => onFilterChange('UNMARKED')}
        >
          Unmarked ({filterCounts.unmarked || 0})
        </button>
      </div>

      {/* Batch Actions */}
      <div className="quick-batch-group">
        <button
          className="btn btn-secondary"
          onClick={onMarkAllPresent}
          title="Mark all filtered students as Present"
        >
          <CheckCheck size={16} style={{ color: 'var(--status-present-text)' }} />
          <span>All Present</span>
        </button>

        <button
          className="btn btn-secondary"
          onClick={onMarkAllAbsent}
          title="Mark all filtered students as Absent"
        >
          <XSquare size={16} style={{ color: 'var(--status-absent-text)' }} />
          <span>All Absent</span>
        </button>

        <button
          className="btn btn-secondary btn-icon"
          onClick={onInvertAttendance}
          title="Invert Attendance (P ↔ A)"
        >
          <Shuffle size={16} />
        </button>

        <button
          className="btn btn-secondary btn-icon"
          onClick={onRandomStudent}
          title="Pick a random student (Callout Mode)"
        >
          <Dice5 size={16} />
        </button>

        <button
          className="btn btn-secondary btn-icon"
          onClick={onClearAttendance}
          title="Reset / Clear all marks"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}
