'use client';

import React from 'react';
import StudentCard from './StudentCard';
import { SearchX, UserX } from 'lucide-react';

export default function StudentList({
  students = [],
  currentAttendance = {},
  onStatusChange,
  activeSessionHeader,
  highlightedStudentId = null
}) {
  if (students.length === 0) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '3rem 1.5rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
          color: 'var(--text-muted)'
        }}
      >
        <SearchX size={48} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          No Students Found
        </h3>
        <p style={{ fontSize: '0.875rem', maxWidth: '400px' }}>
          No students match your active filter or search query. Try clearing your search or switching filters.
        </p>
      </div>
    );
  }

  return (
    <div className="student-grid">
      {students.map((student) => (
        <StudentCard
          key={student.id}
          student={student}
          currentStatus={currentAttendance[student.id] || ''}
          onStatusChange={onStatusChange}
          activeSessionHeader={activeSessionHeader}
          isHighlighted={highlightedStudentId === student.id}
        />
      ))}
    </div>
  );
}
