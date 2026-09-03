import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const logsFilePath = path.join(process.cwd(), 'app-logs.json');

function readLogs() {
  try {
    if (fs.existsSync(logsFilePath)) {
      const data = fs.readFileSync(logsFilePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to read logs file', err);
  }
  return [];
}

function writeLogs(logs) {
  try {
    fs.writeFileSync(logsFilePath, JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error('Failed to write logs file', err);
  }
}

export async function GET(request) {
  const logs = readLogs();
  return NextResponse.json(logs);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const logs = readLogs();
    
    const newLog = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      level: body.level || 'info', // 'info', 'warn', 'error', 'exception'
      message: body.message || '',
      details: body.details || null
    };

    logs.unshift(newLog); // Add to beginning
    
    // Keep only last 1000 logs to prevent file from getting too large
    if (logs.length > 1000) {
      logs.length = 1000;
    }

    writeLogs(logs);
    return NextResponse.json({ success: true, log: newLog });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  writeLogs([]);
  return NextResponse.json({ success: true });
}
