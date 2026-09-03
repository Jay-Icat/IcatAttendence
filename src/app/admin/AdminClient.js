'use client';

import { useState, useEffect } from 'react';
import { Settings, Lock, Check, Copy, FileCode2, Info, ChevronRight, AlertTriangle, Link as LinkIcon, Save } from 'lucide-react';

export default function AdminClient({ scriptContent }) {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [scriptUrl, setScriptUrl] = useState('');
  const [savedSettings, setSavedSettings] = useState(false);

  useEffect(() => {
    try {
      setSheetUrl(localStorage.getItem('autoattend_sheet_url') || '');
      setScriptUrl(localStorage.getItem('autoattend_script_url') || '');
    } catch (e) {}
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'rajivicatdrao') {
      setAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveSettings = () => {
    try {
      if (sheetUrl) {
        localStorage.setItem('autoattend_sheet_url', sheetUrl);
      } else {
        localStorage.removeItem('autoattend_sheet_url');
      }
      
      if (scriptUrl) {
        localStorage.setItem('autoattend_script_url', scriptUrl);
      } else {
        localStorage.removeItem('autoattend_script_url');
      }
      
      setSavedSettings(true);
      setTimeout(() => setSavedSettings(false), 2000);
    } catch (e) {
      alert("Failed to save settings to browser storage.");
    }
  };

  if (!authenticated) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '2rem'
      }}>
        <div style={{ marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '16px',
            marginBottom: '1rem', border: '1px solid rgba(99, 102, 241, 0.2)', boxShadow: '0 0 30px rgba(99,102,241,0.15)'
          }}>
            <Settings size={40} color="#818cf8" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>AutoAttendance</h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.25rem', textTransform: 'uppercase', fontSize: '0.85rem' }}>System Administration</p>
        </div>

        <form onSubmit={handleLogin} style={{
          background: 'var(--bg-card)', padding: '2.5rem', borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)', width: '100%', maxWidth: '420px',
          border: '1px solid var(--border-glass)', position: 'relative', overflow: 'hidden'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '2rem', textAlign: 'center', color: 'var(--text-primary)' }}>Enter Admin Password</h2>
          
          <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '1rem', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
              <Lock size={20} color="var(--text-muted)" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              style={{
                width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                borderRadius: '12px', padding: '0.875rem 1rem 0.875rem 2.75rem', color: 'var(--text-primary)',
                fontSize: '1rem', outline: 'none', boxSizing: 'border-box'
              }}
              placeholder="••••••••••••"
              autoFocus
            />
          </div>

          {error && (
            <div style={{
              marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', display: 'flex',
              alignItems: 'center', gap: '0.75rem', color: '#f87171', fontSize: '0.875rem'
            }}>
              <AlertTriangle size={16} />
              <p style={{ margin: 0 }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            style={{
              width: '100%', background: 'var(--accent-gradient)', color: '#fff', fontWeight: 600,
              padding: '0.875rem', borderRadius: '12px', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              fontSize: '1rem', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
            }}
          >
            Authenticate <ChevronRight size={20} />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, background: 'rgba(11, 16, 29, 0.8)',
        backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-glass)',
        padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <Settings size={24} color="#818cf8" />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            AutoAttendance <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.85rem', textTransform: 'uppercase', marginLeft: '0.5rem' }}>Admin Panel</span>
          </h1>
        </div>
        <button 
          onClick={() => { setAuthenticated(false); setPassword(''); }} 
          style={{
            background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)',
            padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600
          }}
        >
          Secure Logout
        </button>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        
        {/* URLs Configuration Section */}
        <section style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
          borderRadius: '24px', padding: '2.5rem', boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <LinkIcon size={24} color="#34d399" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Target Sheet Configuration</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>Update the Google Sheet URL if you are using a new copy of the attendance sheet.</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Google Sheet URL</label>
              <input 
                type="text" 
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                style={{
                  width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                  borderRadius: '12px', padding: '0.875rem 1rem', color: 'var(--text-primary)',
                  fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Apps Script Web App URL</label>
              <input 
                type="text" 
                value={scriptUrl}
                onChange={(e) => setScriptUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                style={{
                  width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                  borderRadius: '12px', padding: '0.875rem 1rem', color: 'var(--text-primary)',
                  fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
                }}
              />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>Only needed if you deployed a new script project. Otherwise, leave blank to use the default.</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button 
                onClick={saveSettings}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: savedSettings ? 'rgba(16, 185, 129, 0.2)' : 'var(--accent-gradient)',
                  color: savedSettings ? '#34d399' : '#fff',
                  border: savedSettings ? '1px solid rgba(16, 185, 129, 0.4)' : 'none',
                  padding: '0.75rem 1.5rem', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: savedSettings ? 'none' : '0 4px 15px rgba(99, 102, 241, 0.3)'
                }}
              >
                {savedSettings ? <><Check size={18} /> Saved successfully</> : <><Save size={18} /> Save Configuration</>}
              </button>
            </div>
          </div>
        </section>

        {/* Setup Guide Section (List Mode) */}
        <section style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
          borderRadius: '24px', padding: '2.5rem', boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <Info size={24} color="#60a5fa" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Google Apps Script Deployment Guide</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>Precise step-by-step instructions to deploy the backend sync engine.</p>
            </div>
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.15)', border: '1px solid var(--border-glass)', borderRadius: '16px', padding: '2rem' }}>
            <ol style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '0.95rem', 
              lineHeight: 1.8, 
              margin: 0,
              paddingLeft: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <li>Open your destination Google Sheet in the browser.</li>
              <li>From the top menu bar, click on <strong style={{ color: 'var(--text-primary)' }}>Extensions &gt; Apps Script</strong>.</li>
              <li>A new tab will open with the Apps Script editor. On the left side, ensure <strong style={{ color: 'var(--text-primary)' }}>Code.gs</strong> is selected.</li>
              <li>Delete <em>all</em> existing code inside the editor so it is completely blank.</li>
              <li>Scroll down to the "Latest Backend Script" section below and click <strong style={{ color: 'var(--text-primary)' }}>Copy Entire Code</strong>.</li>
              <li>Paste the copied code directly into the empty `Code.gs` editor.</li>
              <li>Click the <strong style={{ color: 'var(--text-primary)' }}>Save</strong> (floppy disk) icon at the top of the editor.</li>
              <li>Click the blue <strong style={{ color: 'var(--text-primary)' }}>Deploy</strong> button in the top right, then select <strong style={{ color: 'var(--text-primary)' }}>New deployment</strong>.</li>
              <li>In the "Select type" gear icon (⚙️), ensure <strong style={{ color: 'var(--text-primary)' }}>Web app</strong> is checked.</li>
              <li>Set <em>Execute as</em> to: <strong style={{ color: '#34d399' }}>Me</strong></li>
              <li>Set <em>Who has access</em> to: <strong style={{ color: '#34d399' }}>Anyone</strong></li>
              <li>Click <strong style={{ color: 'var(--text-primary)' }}>Deploy</strong>. If prompted, click "Review permissions", select your Google account, click "Advanced", and click "Go to [Project Name] (unsafe)" to authorize.</li>
              <li>Copy the generated <strong>Web app URL</strong> from the final screen and paste it into the "Apps Script Web App URL" box above.</li>
            </ol>
          </div>

          <div style={{
            marginTop: '1.5rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '16px', padding: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem'
          }}>
            <AlertTriangle size={24} color="#f59e0b" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
            <div>
              <h4 style={{ color: '#f59e0b', fontWeight: 600, margin: '0 0 0.25rem 0' }}>Updating an existing script?</h4>
              <p style={{ color: 'rgba(253, 230, 138, 0.8)', fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }}>
                If you ever edit the code later, you MUST click <strong>Deploy &gt; Manage deployments</strong>, click the pencil edit icon, change the version to <strong>"New"</strong>, and click Deploy. If you skip this, your changes will not go live.
              </p>
            </div>
          </div>
        </section>

        {/* Script Code Section */}
        <section style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '24px',
          overflow: 'hidden', boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 2rem',
            borderBottom: '1px solid var(--border-glass)', background: 'rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FileCode2 size={20} color="#818cf8" />
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Latest Backend Script (v3.0 - Resilient Anchor System)</h2>
            </div>
            <button
              onClick={handleCopy}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '12px',
                fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                border: copied ? '1px solid rgba(16, 185, 129, 0.3)' : 'none',
                background: copied ? 'rgba(16, 185, 129, 0.2)' : 'var(--accent-gradient)',
                color: copied ? '#34d399' : '#fff',
                boxShadow: copied ? 'none' : '0 4px 15px rgba(99, 102, 241, 0.2)'
              }}
            >
              {copied ? <><Check size={16} /> Code Copied</> : <><Copy size={16} /> Copy Entire Code</>}
            </button>
          </div>
          
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '2.5rem',
              background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', padding: '0 1.5rem', gap: '0.5rem',
              borderBottom: '1px solid var(--border-glass)'
            }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#334155' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#334155' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#334155' }}></div>
              <span style={{ marginLeft: '1rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Code.gs</span>
            </div>
            
            <textarea
              readOnly
              value={scriptContent}
              style={{
                width: '100%', height: '600px', background: 'var(--bg-app)', color: '#e2e8f0',
                fontSize: '0.875rem', fontFamily: 'var(--font-mono)', padding: '3.5rem 1.5rem 1.5rem 1.5rem',
                border: 'none', outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box'
              }}
              spellCheck="false"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
