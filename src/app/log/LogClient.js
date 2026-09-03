"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LogClient() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/logs');
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const clearLogs = async () => {
    try {
      await fetch('/api/logs', { method: 'DELETE' });
      setLogs([]);
    } catch(e){}
  }

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.level === filter;
  });

  return (
    <div className="app-container" style={{ padding: '20px', minHeight: '100vh', color: '#f8fafc' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', background: 'var(--panel-bg)', padding: '30px', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', margin: 0 }}>System Logs</h1>
          <div style={{ display: 'flex', gap: '15px' }}>
             <Link href="/" style={{ color: 'var(--primary)', textDecoration: 'none', padding: '8px 16px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px' }}>Back to Home</Link>
             <button onClick={fetchLogs} style={{ padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>Refresh</button>
             <button onClick={clearLogs} style={{ padding: '8px 16px', background: '#ef4444', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>Clear Logs</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          {['all', 'info', 'warn', 'error', 'exception'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                textTransform: 'capitalize',
                background: filter === f ? 'var(--primary)' : 'var(--surface)',
                color: filter === f ? 'white' : '#94a3b8'
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '70vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Loading logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No logs found.</div>
          ) : (
            filteredLogs.map(log => (
              <div key={log.id} style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'var(--surface)',
                borderLeft: `4px solid ${log.level === 'error' || log.level === 'exception' ? '#ef4444' : log.level === 'warn' ? '#f59e0b' : '#3b82f6'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
                  <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{log.level}</span>
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <div style={{ fontSize: '15px' }}>{log.message}</div>
                {log.details && (
                  <div style={{ fontSize: '13px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '4px', marginTop: '4px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                    {log.details}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
