import { useState, useRef, useEffect } from 'react';

const SUGGESTIONS = [
  'What happens if I leave after 6 months and join a startup in Bengaluru?',
  'Can they enforce the non-compete internationally?',
  'Who owns my side projects under this contract?',
  'What are the real financial risks if I breach this agreement?',
];

export default function ChatInterface({ sessionId, selectedCategory, compact = false }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage(q) {
    if (!q.trim() || loading) return;

    setMessages((m) => [...m, { role: 'user', content: q }]);
    setQuestion('');
    setLoading(true);

    let assistantText = '';
    setMessages((m) => [...m, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, question: q, selectedCategory }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Chat failed (${res.status})`);
      }

      if (!res.body) {
        throw new Error('No response stream from server');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) throw new Error(data.error);
            if (data.text) {
              assistantText += data.text;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: 'assistant', content: assistantText };
                return copy;
              });
            }
          } catch (err) {
            if (err.message && !err.message.includes('JSON')) throw err;
          }
        }
      }

      if (!assistantText) {
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: 'assistant', content: 'No response from model.' };
          return copy;
        });
      }
    } catch (err) {
      setMessages((m) => [
        ...m.slice(0, -1),
        { role: 'assistant', content: `Error: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const shellClass = compact
    ? 'flex flex-col h-full max-h-[240px]'
    : 'glass-card overflow-hidden mt-16';

  return (
    <section className={compact ? '' : 'mt-16'}>
      <div className={shellClass}>
        {!compact && (
          <div className="px-6 py-5 border-b border-surface-divider">
            <h2 className="text-lg font-semibold text-ink">Ask about this contract</h2>
            <p className="mt-1 text-xs text-ink-muted">
              Uses your session analysis{selectedCategory ? ` · focused on ${selectedCategory.replace(/_/g, ' ')}` : ''}
            </p>
          </div>
        )}

        <div
          ref={scrollRef}
          className={`overflow-y-auto px-4 py-3 space-y-3 ${compact ? 'flex-1' : 'max-h-[400px] px-6 py-4'}`}
        >
          {messages.length === 0 && (
            <div className={`text-center ${compact ? 'py-2' : 'py-8'}`}>
              <p className={`text-sm text-ink-faint mb-3 ${compact ? 'text-xs' : ''}`}>Try a scenario question:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => sendMessage(s)}
                    className={`text-left px-2 py-1.5 rounded-lg text-ink-muted bg-paper-card border border-surface-border hover:border-accent/30 hover:text-accent transition-all ${
                      compact ? 'text-[10px] max-w-full' : 'text-xs'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? compact
                      ? 'bg-accent/10 text-[#1e293b] border border-accent/20'
                      : 'bg-accent/10 text-ink border border-accent/15 rounded-br-md'
                    : compact
                      ? 'bg-[#f8fafc] text-[#475569] border border-[#e2e8f0] rounded-bl-md'
                      : 'bg-paper-card text-ink-muted border border-surface-border rounded-bl-md'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content || '…'}</div>
              </div>
            </div>
          ))}
        </div>

        <div className={`border-t border-surface-divider ${compact ? 'px-2 py-2' : 'px-6 py-4'}`}>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(question);
            }}
          >
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about a clause or scenario…"
              className={`input-field flex-1 ${compact ? 'text-sm py-2' : ''}`}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className={`btn-primary whitespace-nowrap ${compact ? 'text-sm px-3 py-2' : ''}`}
            >
              {loading ? '…' : 'Ask'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
