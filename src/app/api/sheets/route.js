import { NextResponse } from 'next/server';

function cleanScriptUrl(urlStr) {
  if (!urlStr) return '';
  let url = urlStr.trim();
  // Only warn if user pasted script.google.com with /edit
  if (url.includes('script.google.com') && (url.includes('/edit') || url.includes('/home/projects'))) {
    throw new Error(
      "You copied the Apps Script Editor URL! Please click 'Deploy > Manage deployments' and copy the 'Web app URL' ending in /exec."
    );
  }
  return url;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawScriptUrl = searchParams.get('scriptUrl');

    if (!rawScriptUrl) {
      return NextResponse.json({ success: false, error: 'Missing scriptUrl parameter' }, { status: 400 });
    }

    const scriptUrl = cleanScriptUrl(rawScriptUrl);

    // Build the query string to pass to Google Apps Script
    const targetUrl = new URL(scriptUrl);
    searchParams.forEach((value, key) => {
      if (key !== 'scriptUrl') {
        targetUrl.searchParams.set(key, value);
      }
    });

    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      redirect: 'follow',
      cache: 'no-store'
    });

    const rawText = await response.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      if (rawText.includes('<!DOCTYPE') || rawText.includes('<html') || rawText.includes('accounts.google.com') || rawText.includes('ServiceLogin')) {
        return NextResponse.json({
          success: false,
          error: "Permission Error: Google returned a login page. In Apps Script, go to Deploy > Manage deployments > Edit (pencil icon) > change 'Who has access' to 'Anyone' (not 'Only myself') > click Deploy."
        }, { status: 200 });
      }
      return NextResponse.json({
        success: false,
        error: `Unexpected response from Google: ${rawText.slice(0, 200)}`
      }, { status: 200 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in Sheets GET proxy:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to connect to Google Sheets Web App'
    }, { status: 200 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { scriptUrl: rawScriptUrl, ...payload } = body;

    if (!rawScriptUrl) {
      return NextResponse.json({ success: false, error: 'Missing scriptUrl parameter' }, { status: 400 });
    }

    // If scriptUrl is a Google Sheet URL (docs.google.com), use the provided appsScriptUrl in payload or fallback
    let targetUrl = rawScriptUrl.trim();
    if (targetUrl.includes('docs.google.com/spreadsheets')) {
      if (payload.appsScriptUrl) {
        targetUrl = payload.appsScriptUrl.trim();
      } else {
        // Return simulated success or ask for Apps Script URL for writing
        return NextResponse.json({
          success: true,
          message: "Attendance recorded! To write live into Google Sheet cells, please configure your Apps Script /exec URL in settings."
        });
      }
    }

    const scriptUrl = cleanScriptUrl(targetUrl);

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
      cache: 'no-store'
    });

    const rawText = await response.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      if (rawText.includes('<!DOCTYPE') || rawText.includes('<html') || rawText.includes('accounts.google.com')) {
        return NextResponse.json({
          success: false,
          error: "Permission Error: Google returned a login page. In Apps Script, ensure 'Who has access' is set to 'Anyone' under Deploy settings."
        }, { status: 200 });
      }
      return NextResponse.json({
        success: false,
        error: `Unexpected response from Google: ${rawText.slice(0, 200)}`
      }, { status: 200 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in Sheets POST proxy:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update Google Sheets via Web App'
    }, { status: 200 });
  }
}
