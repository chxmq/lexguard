import { Link } from 'react-router-dom';

function NavIcon({ children }) {
  return <span className="w-5 h-5 flex items-center justify-center opacity-80">{children}</span>;
}

export default function WorkspaceLayout({ documentType, riskScore, sidebar, main, context, footer }) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#e8edf2]">
      <div className="flex flex-1 min-h-0">
        <aside className="w-[220px] shrink-0 flex flex-col bg-[#151f2b] text-[#c5d0db] border-r border-black/20">
          <Link to="/" className="flex items-center gap-2.5 px-5 py-5 border-b border-white/5">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e58e8e" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">LexGuard</p>
              <p className="text-[10px] text-[#7a8a99]">Contract intelligence</p>
            </div>
          </Link>

          <nav className="flex-1 px-3 py-4 space-y-1 text-sm overflow-y-auto">
            <p className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[#5c6b7a]">
              Workspace
            </p>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/8 text-white">
              <NavIcon>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                </svg>
              </NavIcon>
              Document review
            </div>
            {sidebar}
          </nav>

          <div className="p-3 border-t border-white/5">
            <Link
              to="/"
              className="flex items-center justify-center w-full py-2.5 rounded-xl text-xs font-medium bg-accent text-[#1a2b3c] hover:bg-accent-bright transition-colors"
            >
              New analysis
            </Link>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="shrink-0 h-14 px-5 flex items-center justify-between border-b border-[#d0dae3] bg-[#f4f7fa]">
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-sm font-semibold text-[#1a2b3c] truncate">Contract analysis</h1>
              {documentType && (
                <span className="hidden sm:inline px-2 py-0.5 rounded-md text-[10px] font-mono uppercase bg-white border border-[#d0dae3] text-[#5c6b7a]">
                  {documentType.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            {riskScore != null && (
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide text-[#7a8a99]">Risk score</p>
                <p className="text-lg font-bold text-[#1a2b3c] leading-none">{riskScore}</p>
              </div>
            )}
          </header>

          <div className="flex flex-1 min-h-0">
            <main className="flex-1 min-w-0 flex flex-col bg-[#eef2f6]">{main}</main>
            <aside className="w-[380px] shrink-0 flex flex-col border-l border-[#d0dae3] bg-[#f8fafc] min-h-0">
              {context}
            </aside>
          </div>
          {footer}
        </div>
      </div>
    </div>
  );
}
