"use client";

import { useEffect, useRef, useState } from "react";

import {
  mergeExtractedFields,
  sendChat,
  type ChatMessage,
} from "@/lib/chat";
import type { NDAFormData } from "@/lib/nda";

type Props = {
  data: NDAFormData;
  onChange: (data: NDAFormData) => void;
  onReadyChange?: (ready: boolean) => void;
};

export default function ChatPanel({ data, onChange, onReadyChange }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const greeted = useRef(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Kick off the conversation with an AI-generated greeting + first question.
  useEffect(() => {
    if (greeted.current) return;
    greeted.current = true;
    void runTurn([], data);
    // We intentionally pass the initial data and an empty history once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  const runTurn = async (history: ChatMessage[], currentFields: NDAFormData) => {
    setSending(true);
    setError(null);
    try {
      const turn = await sendChat(history, currentFields);
      const nextFields = mergeExtractedFields(currentFields, turn.extracted_fields);
      onChange(nextFields);
      onReadyChange?.(turn.document_ready);
      setMessages([
        ...history,
        { role: "assistant", content: turn.assistant_message },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed.");
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    void runTurn(next, data);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto pr-2"
        aria-live="polite"
      >
        {messages.length === 0 && !sending && !error && (
          <p className="text-sm text-zinc-500">
            Starting the conversation…
          </p>
        )}
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} />
        ))}
        {sending && (
          <div className="text-xs italic text-zinc-500">Assistant is typing…</div>
        )}
        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      <div className="mt-3 border-t border-zinc-200 pt-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your reply…"
            rows={2}
            disabled={sending}
            className="flex-1 resize-none rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:bg-zinc-50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Send
          </button>
        </div>
        <p className="mt-2 text-[11px] text-zinc-500">
          Press Enter to send, Shift+Enter for a new line.
        </p>
      </div>
    </div>
  );
}

function Bubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
          isUser
            ? "bg-zinc-900 text-white"
            : "bg-zinc-100 text-zinc-900 border border-zinc-200"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
