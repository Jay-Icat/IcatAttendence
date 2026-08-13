'use client';

import React from 'react';
import { Check, X, FileText } from 'lucide-react';

export default function StudentRow({
  student,
  currentStatus,
  onStatusChange
}) {
  const { id, rollNo, name, batchYear } = student;

  return (
    <div className={`student-row ${currentStatus ? `status-${currentStatus.toLowerCase()}` : ''}`}>
      {/* Student Identity */}
      <div className="student-row-left">
        <span className="student-row-roll">#{rollNo || id}</span>
        <div className="student-row-info">
          <span className="student-row-name">{name}</span>
          {batchYear && batchYear !== 'General' && (
            <span className="student-row-batch">Batch {batchYear}</span>
          )}
        </div>
      </div>

      {/* 3 Action Buttons at Row End: P, A, OD */}
      <div className="student-row-actions">
        <button
          type="button"
          className={`row-action-btn btn-p ${currentStatus === 'P' ? 'active' : ''}`}
          onClick={() => onStatusChange(id, currentStatus === 'P' ? '' : 'P')}
          title="Mark Present (P)"
        >
          <Check size={15} strokeWidth={2.5} />
          <span>P</span>
        </button>

        <button
          type="button"
          className={`row-action-btn btn-a ${currentStatus === 'A' ? 'active' : ''}`}
          onClick={() => onStatusChange(id, currentStatus === 'A' ? '' : 'A')}
          title="Mark Absent (A)"
        >
          <X size={15} strokeWidth={2.5} />
          <span>A</span>
        </button>

        <button
          type="button"
          className={`row-action-btn btn-od ${currentStatus === 'OD' ? 'active' : ''}`}
          onClick={() => onStatusChange(id, currentStatus === 'OD' ? '' : 'OD')}
          title="Mark On-Duty (OD)"
        >
          <FileText size={14} strokeWidth={2.2} />
          <span>OD</span>
        </button>
      </div>
    </div>
  );
}
