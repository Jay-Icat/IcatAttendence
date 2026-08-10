'use client';

import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Link as LinkIcon, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Settings2, 
  Play,
  FileSpreadsheet,
  Code
} from 'lucide-react';

export default function SetupGuideModal({
  isOpen,
  onClose,
  scriptUrl,
  onChangeScriptUrl,
  onTestConnection,
  isTesting,
  testResult,
  columnMapping,
  onChangeColumnMapping,
  onUseDemoMode
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <LinkIcon size={22} style={{ color: 'var(--accent-primary)' }} />
            <span>Connect Your Google Sheet</span>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Quick Instructions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              fontSize: '0.85rem',
              lineHeight: 1.5
            }}
          >
            <strong>⚡ 2 Ways to Connect:</strong>
            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.35rem', color: 'var(--text-secondary)' }}>
              <li>
                <strong>Direct Sheet Link:</strong> Paste your Google Sheet URL (e.g. <code>https://docs.google.com/spreadsheets/d/.../edit</code>)
              </li>
              <li>
                <strong>Apps Script URL:</strong> Paste your Web App <code>/exec</code> URL
              </li>
            </ul>
          </div>
        </div>

        {/* Input & Connect Button */}
        <div className="form-group" style={{ marginTop: '0.5rem' }}>
          <label className="form-label">Google Sheet URL or Apps Script URL</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="input-control"
              placeholder="Paste https://docs.google.com/spreadsheets/d/... OR https://script.google.com/.../exec"
              value={scriptUrl}
              onChange={(e) => onChangeScriptUrl(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              className="btn btn-primary"
              onClick={onTestConnection}
              disabled={isTesting || !scriptUrl.trim()}
              style={{ minWidth: '150px' }}
            >
              {isTesting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              <span>{isTesting ? 'Connecting...' : 'Connect Sheet'}</span>
            </button>
          </div>
        </div>

        {/* Test Result Feedback */}
        {testResult && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: testResult.success ? 'var(--status-present-bg)' : 'var(--status-absent-bg)',
              border: `1px solid ${testResult.success ? 'var(--status-present-border)' : 'var(--status-absent-border)'}`,
              color: testResult.success ? 'var(--status-present-text)' : 'var(--status-absent-text)',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {testResult.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>
                {testResult.success 
                  ? `Connected! Found ${(testResult.sheets || []).length} department tabs (${(testResult.sheets || []).slice(0, 5).join(', ')}...)`
                  : testResult.error || 'Connection failed.'}
              </span>
            </div>
          </div>
        )}

        {/* Column Layout Settings */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700 }}>
              <Settings2 size={16} style={{ color: 'var(--accent-primary)' }} />
              <span>Sheet Column Layout Settings</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Header Row #</label>
              <input
                type="number"
                min="1"
                className="input-control"
                value={columnMapping.headerRow || 5}
                onChange={(e) => onChangeColumnMapping({ ...columnMapping, headerRow: parseInt(e.target.value, 10) || 5 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Roll / ID Column</label>
              <input
                type="text"
                className="input-control"
                placeholder="A"
                value={columnMapping.idCol || 'A'}
                onChange={(e) => onChangeColumnMapping({ ...columnMapping, idCol: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Name Column</label>
              <input
                type="text"
                className="input-control"
                placeholder="B"
                value={columnMapping.nameCol || 'B'}
                onChange={(e) => onChangeColumnMapping({ ...columnMapping, nameCol: e.target.value.toUpperCase() })}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={onUseDemoMode}>
            <Play size={14} />
            <span>Switch to Demo / Simulator</span>
          </button>

          <button className="btn btn-primary" onClick={onClose}>
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
}
