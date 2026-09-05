import { NextResponse } from 'next/server';
import { DEFAULT_APPS_SCRIPT_URL } from '../../../lib/constants';

export async function POST(request) {
  try {
    const body = await request.json();
    const { scriptUrl, ...payload } = body;

    const targetScriptUrl = (scriptUrl && scriptUrl.includes('script.google.com'))
      ? scriptUrl.trim()
      : DEFAULT_APPS_SCRIPT_URL;

    if (!targetScriptUrl) {
      return NextResponse.json(
        { success: false, error: 'Apps Script URL is not configured' },
        { status: 400 }
      );
    }

    const gasPayload = {
      action: 'saveAttendance',
      sheetName: payload.sheetName || 'GT',
      date: payload.date || '',
      session: payload.session || '',
      sessionCode: payload.sessionCode || '',
      moduleTitle: payload.moduleTitle || '',
      moduleTutor: payload.moduleTutor || '',
      updates: payload.updates || []
    };

    // Forward request server-to-server (No browser CORS restrictions, follows 302 redirects)
    const response = await fetch(targetScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(gasPayload),
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error('Google Apps Script returned HTTP status ' + response.status);
    }

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      // In case Apps Script returned HTML or plain text confirmation
      if (text.includes('Successfully marked') || text.includes('Attendance Synced') || text.includes('✅')) {
        data = { success: true, message: 'Attendance synced successfully!' };
      } else {
        data = { success: true, message: 'Attendance sync processed', raw: text };
      }
    }

    if (data && data.success === false) {
      return NextResponse.json(
        { success: false, error: data.error || data.message || 'Apps Script sync failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: data.message || 'Attendance synced to Google Sheet!',
      result: data.result || null
    });
  } catch (err) {
    console.error('Error in /api/sync:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to sync with Google Sheet' },
      { status: 500 }
    );
  }
}
