export const Logger = {
  info: (message, details = null) => logToServer('info', message, details),
  warn: (message, details = null) => logToServer('warn', message, details),
  error: (message, details = null) => logToServer('error', message, details),
  exception: (message, details = null) => logToServer('exception', message, details)
};

async function logToServer(level, message, details) {
  try {
    // Also log to console for development
    if (level === 'error' || level === 'exception') console.error(`[${level.toUpperCase()}]`, message, details || '');
    else if (level === 'warn') console.warn(`[${level.toUpperCase()}]`, message, details || '');
    else console.log(`[${level.toUpperCase()}]`, message, details || '');

    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, details })
    }).catch(e => console.error('Failed to send log to server:', e));
  } catch (err) {
    console.error('Logger error:', err);
  }
}
