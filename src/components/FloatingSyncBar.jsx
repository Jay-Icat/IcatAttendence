'use client';

import React from 'react';
import { Send, Loader2, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';

export default function FloatingSyncBar({
  isSyncing,
  syncSuccess,
  syncError,
  onSync,
  totalStudents = 0,
  markedCount = 0,
  activeSheet = '',
  targetSessionHeader = '',
  isDemo = false
}) {
  return (
    <div className="floating-sync-bar">
      <div className="sync-info">
        <div className="brand-logo" style={{ width: '38px', height: '38px', borderRadius: '10px' }}>
          <FileSpreadsheet size={20} />
        </div>
        <div>
          <div className="sync-badge">
            <span>{markedCount} of {totalStudents} Marked</span>
            {markedCount === totalStudents && totalStudents > 0 && (
              <span className="badge badge-present" style={{ fontSize: '0.65rem' }}>
                Complete
              </span>
            )}
          </div>
          <div className="sync-target-text">
            Sheet: <span className="sync-target-highlight">{activeSheet}</span> • Target:{' '}
            <span className="sync-target-highlight">{targetSessionHeader}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {syncSuccess && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--status-present-text)', fontSize: '0.85rem', fontWeight: 600 }}>
            <CheckCircle size={16} /> Saved to Sheet!
          </span>
        )}

        {syncError && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--status-absent-text)', fontSize: '0.85rem', fontWeight: 600 }}>
            <AlertCircle size={16} /> {syncError}
          </span>
        )}

        <button
          className="btn btn-primary"
          onClick={onSync}
          disabled={isSyncing || markedCount === 0}
          style={{ minWidth: '180px' }}
        >
          {isSyncing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Updating Sheet...</span>
            </>
          ) : (
            <>
              <Send size={18} />
              <span>{isDemo ? 'Simulate Sync' : 'Sync to Google Sheet'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
