'use client';

import { useState } from 'react';

export default function AdminClient({ scriptContent }) {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'rajivicatdrao') {
      setAuthenticated(true);
    } else {
      alert('Incorrect password');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-200 flex items-center justify-center p-6">
        <form onSubmit={handleLogin} className="bg-slate-800 p-8 rounded-xl shadow-xl w-full max-w-md border border-slate-700/50">
          <h1 className="text-2xl font-bold mb-6 text-center text-white">Admin Login</h1>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter admin password"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            Access Dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-6 sm:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="text-indigo-500">⚙️</span> Admin Settings
          </h1>
          <button onClick={() => setAuthenticated(false)} className="text-slate-400 hover:text-white transition-colors">
            Log out
          </button>
        </div>

        <div className="space-y-8">
          {/* Instructions */}
          <section className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Google Apps Script Setup</h2>
            <div className="space-y-4 text-slate-300">
              <p>Follow these steps to deploy the backend script for your Google Sheet:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Open your Google Sheet.</li>
                <li>Go to <strong>Extensions &gt; Apps Script</strong>.</li>
                <li>Delete any existing code in `Code.gs`.</li>
                <li>Copy the latest code from the block below and paste it in.</li>
                <li>Click the <strong>Save</strong> (floppy disk) icon.</li>
                <li>Click <strong>Deploy &gt; New deployment</strong>.</li>
                <li>Select type <strong>Web app</strong> (click the gear icon to add it if missing).</li>
                <li>Set "Execute as" to <strong>Me</strong>.</li>
                <li>Set "Who has access" to <strong>Anyone</strong>.</li>
                <li>Click <strong>Deploy</strong> and authorize permissions if asked.</li>
              </ol>
              <p className="mt-4 text-amber-400 text-sm">
                <strong>Important:</strong> If you modify the script later, you MUST select <strong>Deploy &gt; Manage deployments</strong>, click the pencil icon, and change the version to "New" before saving. Do not just click Save in the editor!
              </p>
            </div>
          </section>

          {/* Script Code */}
          <section className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700/50 shadow-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/50">
              <h2 className="text-lg font-semibold text-white">Latest Script Code</h2>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              >
                {copied ? '✓ Copied' : '📋 Copy Code'}
              </button>
            </div>
            <div className="p-0">
              <textarea
                readOnly
                value={scriptContent}
                className="w-full h-96 bg-slate-900/50 text-slate-300 text-sm font-mono p-6 focus:outline-none resize-y"
                spellCheck="false"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
