'use client';

import React from 'react';
import { X, Sparkles, Check, X as XIcon, Dice5, RotateCcw } from 'lucide-react';

export default function RandomStudentModal({
  isOpen,
  onClose,
  student,
  currentStatus,
  onMarkStatus,
  onSpinAgain
}) {
  if (!isOpen || !student) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '440px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ justifyContent: 'center', position: 'relative' }}>
          <div className="modal-title" style={{ color: 'var(--accent-primary)' }}>
            <Dice5 size={24} />
            <span>Random Student Picker</span>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ position: 'absolute', right: 0 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div
            className="student-avatar"
            style={{ width: '72px', height: '72px', fontSize: '1.75rem', borderRadius: 'var(--radius-lg)' }}
          >
            {student.name.slice(0, 2).toUpperCase()}
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {student.name}
          </h2>

          <span className="student-id" style={{ fontSize: '1rem', padding: '0.2rem 0.8rem' }}>
            Roll No: {student.id}
          </span>
        </div>

        {/* Action Toggles */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <button
            className="btn btn-success"
            style={{ padding: '0.85rem' }}
            onClick={() => {
              onMarkStatus(student.id, 'P');
              onClose();
            }}
          >
            <Check size={20} />
            <span>Mark Present (P)</span>
          </button>

          <button
            className="btn btn-danger"
            style={{ padding: '0.85rem' }}
            onClick={() => {
              onMarkStatus(student.id, 'A');
              onClose();
            }}
          >
            <XIcon size={20} />
            <span>Mark Absent (A)</span>
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <button className="btn btn-secondary" onClick={onSpinAgain}>
            <RotateCcw size={16} />
            <span>Pick Another Student</span>
          </button>
        </div>
      </div>
    </div>
  );
}
