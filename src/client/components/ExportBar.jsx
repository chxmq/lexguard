import { useEffect, useState } from 'react';
import { getGoogleTokens, hasGoogleTokens, clearGoogleTokens } from '../lib/google-tokens.js';

export default function ExportBar({ sessionId, compact = false }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(null);
  const [googleConnected, setGoogleConnected] = useState(false);

  useEffect(() => {
    setGoogleConnected(hasGoogleTokens());

    function onMessage(e) {
      if (e.data?.type === 'lexguard-oauth-done') {
        setGoogleConnected(hasGoogleTokens());
        setStatus({ type: 'success', message: 'Google account connected' });
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  async function connectGoogle() {
    setStatus(null);
    try {
      const res = await fetch('/api/auth/url');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'OAuth not configured');
      window.open(data.url, 'lexguard-google-oauth', 'width=520,height=640');
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    }
  }

  async function exportFormat(format) {
    setLoading(format);
    setStatus(null);

    const tokens = getGoogleTokens();

    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, format, tokens }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Export failed');

      if (data.url) {
        window.open(data.url, '_blank');
        setStatus({ type: 'success', message: `Opened ${format} export` });
      } else if (format === 'pdf' && data.contentBase64) {
        const bytes = Uint8Array.from(atob(data.contentBase64), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: data.mimeType || 'application/pdf' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = data.filename || 'lexguard-report.pdf';
        a.click();
        URL.revokeObjectURL(a.href);
        setStatus({ type: 'success', message: 'PDF downloaded' });
      } else if (format === 'pdf' && data.downloadText) {
        const blob = new Blob([data.downloadText], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = data.filename || 'lexguard-report.txt';
        a.click();
        setStatus({ type: 'success', message: 'Text report downloaded' });
      } else if (data.mock && data.preview) {
        setStatus({
          type: 'info',
          message: data.message || 'Connect Google to create a live document',
        });
      } else {
        setStatus({ type: 'info', message: data.message || `${format} export ready` });
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(null);
    }
  }

  const FORMATS = [
    { key: 'docs', label: 'Google Docs', needsGoogle: true },
    { key: 'slides', label: 'Slides', needsGoogle: true },
    { key: 'pdf', label: 'PDF Report', needsGoogle: false },
  ];

  return (
    <div>
      {FORMATS.some((f) => f.needsGoogle) && (
        <div className={`mb-3 ${compact ? 'space-y-2' : 'flex flex-wrap items-center gap-2'}`}>
          {googleConnected ? (
            <button
              type="button"
              onClick={() => {
                clearGoogleTokens();
                setGoogleConnected(false);
                setStatus({ type: 'info', message: 'Google disconnected' });
              }}
              className={
                compact
                  ? 'w-full py-1.5 text-[10px] text-[#9aa8b5] hover:text-white'
                  : 'text-xs text-ink-muted hover:text-ink'
              }
            >
              Disconnect Google
            </button>
          ) : (
            <button
              type="button"
              onClick={connectGoogle}
              className={
                compact
                  ? 'w-full py-2 rounded-lg text-xs font-medium border border-accent/30 text-accent hover:bg-accent/10'
                  : 'btn-outline text-xs'
              }
            >
              Connect Google for Docs/Slides
            </button>
          )}
        </div>
      )}

      <div className={compact ? 'flex flex-col gap-2' : 'flex flex-wrap items-center gap-3'}>
        <span
          className={
            compact
              ? 'text-[10px] font-mono text-[#7a8a99] uppercase tracking-wider'
              : 'text-xs font-mono text-ink-faint uppercase tracking-wider mr-2'
          }
        >
          {compact ? 'Export' : 'Export to'}
        </span>
        {FORMATS.map((fmt) => (
          <button
            key={fmt.key}
            type="button"
            onClick={() => exportFormat(fmt.key)}
            disabled={!!loading || (fmt.needsGoogle && !googleConnected)}
            title={fmt.needsGoogle && !googleConnected ? 'Connect Google first' : undefined}
            className={
              compact
                ? 'w-full py-2 rounded-lg text-xs font-medium border border-white/10 text-[#c5d0db] hover:bg-white/5 disabled:opacity-50'
                : 'btn-outline text-xs disabled:opacity-50'
            }
          >
            {loading === fmt.key ? 'Exporting...' : fmt.label}
          </button>
        ))}
      </div>
      {status && (
        <p
          className={`mt-3 text-sm ${
            compact
              ? status.type === 'error'
                ? 'text-red-300'
                : status.type === 'success'
                  ? 'text-accent'
                  : 'text-[#9aa8b5]'
              : status.type === 'error'
                ? 'text-danger-bright'
                : status.type === 'success'
                  ? 'text-accent-bright'
                  : 'text-ink-muted'
          }`}
        >
          {status.message}
        </p>
      )}
    </div>
  );
}
