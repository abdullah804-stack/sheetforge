"use client";

import { useState, useEffect, useRef } from "react";
import Button from "@/components/ui/Button";

interface ChartData {
  type: "bar" | "pie";
  title: string;
  data: { group: string; value: number }[];
}

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  chart?: ChartData | null;
}

function SparklesIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
      <path d="M4 17v2" />
      <path d="M5 18H3" />
    </svg>
  );
}

function CloseIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function stagger(ms: number): React.CSSProperties {
  return {
    animationDelay: `${ms}ms`,
    transitionDelay: `${ms}ms`,
    animationFillMode: "both",
  };
}

export default function ChatPanel({
  applicationId,
}: {
  applicationId: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || loaded) return;
    async function load() {
      const res = await fetch(
        `/api/applications/chat?applicationId=${applicationId}`
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(
          (data.messages || []).map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            chart: m.chart,
          }))
        );
      }
      setLoaded(true);
    }
    load();
  }, [open, loaded, applicationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, asking]);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || asking) return;

    setInput("");
    setError("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setAsking(true);

    const res = await fetch("/api/applications/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, question: q }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to answer");
      setAsking(false);
      return;
    }

    const data = await res.json();
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: data.text,
        chart: data.chart,
      },
    ]);
    setAsking(false);
  }

  return (
    <>
      <style>{`
        @keyframes chat-dot-pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.85); }
          40% { opacity: 1; transform: scale(1.1); }
        }
        .chat-dot { animation: chat-dot-pulse 1.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .chat-dot { animation: none; opacity: 0.6; }
        }
      `}</style>

      {/* Floating button — outer wrapper owns the entrance animation,
          inner button owns the hover lift */}
      <div
        className="fixed bottom-6 right-6 z-40 animate-fade-up"
        style={stagger(400)}
      >
        <button
          onClick={() => setOpen(true)}
          className="bg-black text-white rounded-full px-5 py-3 shadow-lg hover:bg-gray-800 hover:-translate-y-0.5 transition duration-200 flex items-center gap-2"
        >
          <SparklesIcon size={16} />
          <span className="text-sm font-medium">Ask your data</span>
        </button>
      </div>

      {/* Backdrop (click-outside-to-close) */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-50 bg-black/20 transition-opacity duration-[250ms] ease-out ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Right-side sheet (full-screen on mobile) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ask your data"
        inert={!open}
        className={`fixed inset-y-0 right-0 z-50 h-dvh w-full sm:max-w-md bg-white flex flex-col transition-all duration-[250ms] ease-out ${
          open
            ? "translate-x-0 shadow-xl visible"
            : "translate-x-full shadow-none invisible"
        }`}
      >
        {/* Header (sticky) */}
        <div className="shrink-0 flex items-start justify-between gap-3 bg-white border-b border-gray-100 px-5 py-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Ask your data
            </p>
            <p className="text-xs text-gray-500">
              Ask questions about your spreadsheet in plain English.
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="-mr-1.5 p-1.5 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Messages (scrolls) */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50/50 p-5 space-y-4">
          {messages.length === 0 && !asking && (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500 mb-4">Try asking:</p>
              <div className="space-y-2 max-w-xs mx-auto">
                {[
                  "How many records do I have?",
                  "Which category has the most items?",
                  "What's the total value?",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="w-full text-left text-xs bg-white border border-gray-200 rounded-md px-3 py-2 hover:bg-gray-50 hover:border-gray-300 text-gray-700 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <MessageBubble key={i} message={m} index={i} />
          ))}

          {asking && <TypingBubble />}

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-md text-xs">
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input (sticky) */}
        <form
          onSubmit={handleAsk}
          className="shrink-0 bg-white border-t border-gray-100 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            maxLength={500}
            disabled={asking}
            className="flex-1 min-w-0 border border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black disabled:bg-gray-50"
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={asking || !input.trim()}
          >
            Ask
          </Button>
        </form>
      </div>
    </>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start animate-fade-up" role="status">
      <div className="bg-white border border-gray-100 rounded-lg px-3 py-3 flex items-center gap-1">
        <span className="sr-only">Thinking</span>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="chat-dot block h-1.5 w-1.5 rounded-full bg-gray-400"
            style={{ animationDelay: `${i * 160}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  index,
}: {
  message: Message;
  index: number;
}) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-up`}
      style={stagger(Math.min(index * 30, 300))}
    >
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-black text-white"
            : "bg-white border border-gray-100 text-gray-900"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {message.chart && (
          <div className="mt-2 bg-white border rounded-md p-3">
            <p className="text-xs font-medium text-gray-700 mb-2">
              {message.chart.title}
            </p>
            <MiniChart chart={message.chart} />
          </div>
        )}
      </div>
    </div>
  );
}

function MiniChart({ chart }: { chart: ChartData }) {
  const max = Math.max(...chart.data.map((d) => d.value), 1);

  if (chart.type === "pie") {
    const total = chart.data.reduce((a, b) => a + b.value, 0);
    return (
      <div className="space-y-1.5">
        {chart.data.map((d, i) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          return (
            <div key={i} className="flex items-center gap-2 text-[11px]">
              <span className="w-20 text-gray-500 truncate">{d.group}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-black"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-gray-500 w-8 text-right">{pct}%</span>
            </div>
          );
        })}
      </div>
    );
  }

  // bar
  return (
    <div className="space-y-1.5">
      {chart.data.map((d, i) => (
        <div key={i} className="flex items-center gap-2 text-[11px]">
          <span className="w-20 text-gray-500 truncate">{d.group}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-black"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="text-gray-500 w-8 text-right">{d.value}</span>
        </div>
      ))}
    </div>
  );
}