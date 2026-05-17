import { useCallback, useState } from 'react';

export default function UploadZone({ onUpload, onUrlSubmit, onPasteSubmit, loading }) {
  const [dragOver, setDragOver] = useState(false);
  const [url, setUrl] = useState('');
  const [pasteText, setPasteText] = useState('');

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onUpload(file);
    },
    [onUpload]
  );

  return (
    <div className="space-y-6">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`group block cursor-pointer rounded-2xl border-2 border-dashed p-10 sm:p-14 text-center transition-all duration-300 ${
          dragOver
            ? 'border-accent bg-accent/5 shadow-glow'
            : 'border-surface-border hover:border-accent/30 hover:bg-paper-card/50'
        } ${loading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input
          type="file"
          className="hidden"
          accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.txt"
          disabled={loading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
          }}
        />

        <div
          className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
            dragOver ? 'bg-accent/15 scale-110' : 'bg-paper-card group-hover:bg-accent/10'
          }`}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className={`transition-colors ${dragOver ? 'text-accent' : 'text-ink-faint group-hover:text-accent'}`}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        <p className="text-lg font-semibold text-ink">{loading ? 'Uploading...' : 'Drop your contract here'}</p>
        <p className="mt-2 text-sm text-ink-muted">PDF, DOCX, scanned image, or plain text — up to 25 MB</p>
        <p className="mt-4 text-sm font-medium text-accent group-hover:text-accent-bright transition-colors">
          or click to browse files
        </p>
      </label>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-divider" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-paper px-4 text-xs font-mono uppercase tracking-wider text-ink-faint">
            or paste contract text
          </span>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (pasteText.trim()) onPasteSubmit(pasteText.trim());
        }}
        className="space-y-3"
      >
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder="Paste employment agreement, NDA, or any contract text here…"
          rows={6}
          disabled={loading}
          className="input-field w-full resize-y min-h-[120px] font-mono text-sm"
        />
        <button type="submit" disabled={loading || !pasteText.trim()} className="btn-primary w-full sm:w-auto">
          Analyze pasted text
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-divider" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-paper px-4 text-xs font-mono uppercase tracking-wider text-ink-faint">or paste URL</span>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (url.trim()) onUrlSubmit(url.trim());
        }}
        className="flex gap-3"
      >
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/contract.pdf"
          className="input-field flex-1"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !url.trim()} className="btn-outline whitespace-nowrap">
          Fetch & Analyze
        </button>
      </form>
    </div>
  );
}
