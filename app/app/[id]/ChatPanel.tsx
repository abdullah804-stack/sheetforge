"use client";

import { useState, useEffect, useRef } from "react";

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
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 bg-black text-white rounded-full px-5 py-3 shadow-lg hover:bg-gray-800 transition z-40 flex items-center gap-2"
      >
        <span className="text-sm font-medium">Ask your data</span>
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-end sm:items-center justify-end sm:justify-center p-0 sm:p-6">
          <div
            className="absolute inset-0"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-lg shadow-xl h-[80vh] sm:h-[640px] flex flex-col z-10">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b">
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
                className="text-gray-400 hover:text-gray-900 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.length === 0 && !asking && (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500 mb-4">
                    Try asking:
                  </p>
                  <div className="space-y-2 max-w-xs mx-auto">
                    {[
                      "How many records do I have?",
                      "Which category has the most items?",
                      "What's the total value?",
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => setInput(q)}
                        className="w-full text-left text-xs border border-gray-200 rounded-md px-3 py-2 hover:bg-gray-50 text-gray-700"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <MessageBubble key={i} message={m} />
              ))}

              {asking && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" />
                  Thinking...
                </div>
              )}

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded text-xs">
                  {error}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleAsk}
              className="border-t p-3 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                maxLength={500}
                disabled={asking}
                className="flex-1 border border-gray-300 text-gray-900 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              />
              <button
                type="submit"
                disabled={asking || !input.trim()}
                className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                Ask
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-black text-white"
            : "bg-gray-100 text-gray-900"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {message.chart && (
          <div className="mt-3 bg-white rounded-md border border-gray-200 p-3">
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