'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, Copy, Check, Users } from 'lucide-react';
import { computeStudentCumulativeStats } from '../lib/googleSheets';

export default function DefaultersModal({
  isOpen,
  onClose,
  students = [],
  activeSessionHeader = '',
  currentAttendance = {}
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Filter students who have < 75% attendance
  const defaulters = students
    .map(student => {
      const stats = computeStudentCumulativeStats(
        student,
        activeSessionHeader,
        currentAttendance[student.id]
      );
      return {
        ...student,
        stats
      };
    })
    .filter(s => s.stats.isDefaulter || (s.stats.percentage < 75 && s.stats.totalSessions > 0));

  const handleCopyList = () => {
    const listText = defaulters
      .map(
        (s, idx) =>
          `${idx + 1}. [${s.id}] ${s.name} - ${s.stats.percentage}% (${s.stats.attended}/${s.stats.totalSessions} sessions)`
      )
      .join('\n');

    navigator.clipboard.writeText(
      `--- ATTENDANCE DEFAULTERS LIST (< 75%) ---\nTotal Defaulters: ${defaulters.length}\n\n` + listText
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ color: 'var(--status-absent-text)' }}>
            <AlertTriangle size={22} />
            <span>Attendance Defaulters (&lt; 75%)</span>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Found <strong>{defaulters.length}</strong> student{defaulters.length === 1 ? '' : 's'} needing attention.
          </p>

          {defaulters.length > 0 && (
            <button className="btn btn-secondary" onClick={handleCopyList} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied List!' : 'Copy List'}</span>
            </button>
          )}
        </div>

        {defaulters.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--status-present-text)' }}>
            <h3>🎉 Excellent Attendance!</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
              All students currently maintain at least 75% cumulative attendance.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '350px', overflowY: 'auto' }}>
            {defaulters.map((student) => (
              <div
                key={student.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderLeft: '4px solid var(--status-absent)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {student.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Roll No: {student.id}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--status-absent-text)', fontFamily: 'var(--font-mono)' }}>
                    {student.stats.percentage}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {student.stats.attended} / {student.stats.totalSessions} Sessions
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
