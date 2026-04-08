"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  X,
  Send,
  Loader2,
  Sparkles,
  ChevronDown,
  AlertCircle,
  User,
  Trash2,
  Server,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  provider?: string;
  timestamp: Date;
};

type ProviderHealth = {
  ollama: boolean;
  groq: boolean;
  openrouter: boolean;
};

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "สวัสดีครับ! 👋 ผมคือ **IT Assistant** พร้อมช่วยเหลือด้านไอทีครับ\n\nสามารถถามผมได้เกี่ยวกับ:\n- 🔧 ปัญหาอุปกรณ์และซอฟต์แวร์\n- 🌐 ปัญหาเครือข่าย/อินเทอร์เน็ต\n- 🔑 รหัสผ่านและบัญชีผู้ใช้\n- 📋 วิธีสร้าง Ticket แจ้งซ่อม\n- 📚 ข้อมูลด้านไอทีต่างๆ",
  timestamp: new Date(),
};

const PROVIDER_LABELS: Record<string, string> = {
  ollama: "Ollama (Local)",
  groq: "Groq",
  openrouter: "OpenRouter",
};

const PROVIDER_COLORS: Record<string, string> = {
  ollama: "text-emerald-400",
  groq: "text-orange-400",
  openrouter: "text-violet-400",
};

function ProviderDot({ provider, health }: { provider: string; health: ProviderHealth }) {
  const isOnline = health[provider as keyof ProviderHealth];
  return (
    <div
      className={cn(
        "w-2 h-2 rounded-full",
        isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
      )}
      title={`${PROVIDER_LABELS[provider] || provider}: ${isOnline ? "Online" : "Offline"}`}
    />
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  const renderContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      const lines = part.split("\n");
      return lines.map((line, j) => (
        <span key={`${i}-${j}`}>
          {line}
          {j < lines.length - 1 && <br />}
        </span>
      ));
    });
  };

  return (
    <div className={cn("flex gap-2", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div
        className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
          isUser
            ? "bg-primary/20 text-primary"
            : "bg-linear-to-br from-violet-500 to-blue-500 text-white"
        )}
      >
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
          isUser
            ? "bg-primary text-white rounded-tr-sm"
            : "bg-slate-800/80 text-slate-100 border border-slate-700/50 rounded-tl-sm"
        )}
      >
        <div className="whitespace-pre-line">{renderContent(message.content)}</div>
        <div
          className={cn(
            "flex items-center gap-1.5 mt-1.5 text-[10px]",
            isUser ? "text-white/50 justify-end" : "text-slate-500"
          )}
        >
          <span>
            {message.timestamp.toLocaleTimeString("th-TH", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {message.provider && (
            <>
              <span>·</span>
              <span className={PROVIDER_COLORS[message.provider] || "text-slate-500"}>
                {PROVIDER_LABELS[message.provider] || message.provider}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function AIChatFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [providerHealth, setProviderHealth] = useState<ProviderHealth>({
    ollama: false,
    groq: false,
    openrouter: false,
  });
  const [activeProvider, setActiveProvider] = useState<string>("");
  const [showProviders, setShowProviders] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const healthIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Health check polling
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/health");
      if (res.ok) {
        const data = await res.json();
        setProviderHealth(data.providers);
      }
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    checkHealth();
    healthIntervalRef.current = setInterval(checkHealth, 30000); // Every 30s
    return () => {
      if (healthIntervalRef.current) clearInterval(healthIntervalRef.current);
    };
  }, [checkHealth]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const conversationHistory = messages
        .filter((m) => m.id !== "welcome")
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...conversationHistory,
            { role: "user", content: trimmed },
          ],
        }),
      });

      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();

      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.content || "ขออภัย ไม่สามารถตอบได้ในขณะนี้ครับ",
        provider: data.provider,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setActiveProvider(data.provider || "");

      // Update health status based on which provider was used
      if (data.provider) {
        setProviderHealth((prev) => ({ ...prev, [data.provider]: true }));
      }

      if (!isOpen) setUnreadCount((c) => c + 1);
    } catch {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content:
          "⚠️ ขออภัย ไม่สามารถเชื่อมต่อกับ AI ได้ในขณะนี้\nกรุณาสร้าง Ticket แจ้งซ่อมหรือติดต่อทีม IT โดยตรงครับ",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setActiveProvider("");
  };

  const anyOnline = Object.values(providerHealth).some(Boolean);

  return (
    <>
      {/* FAB Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        <AnimatePresence>
          {!isOpen && unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="bg-rose-500 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg absolute -top-1 -right-1 z-10"
            >
              {unreadCount}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 relative",
            "bg-linear-to-br from-violet-600 via-blue-600 to-cyan-500",
            "hover:shadow-violet-500/30 hover:scale-105 active:scale-95"
          )}
          whileTap={{ scale: 0.92 }}
          title="IT Assistant"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X size={22} className="text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <Bot size={24} className="text-white" />
                {/* Online dot */}
                <div
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
                    anyOnline ? "bg-emerald-400" : "bg-slate-400"
                  )}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className={cn(
              "fixed bottom-24 right-6 z-50",
              "w-[360px] max-h-[580px]",
              "flex flex-col",
              "bg-[#0d0f14] border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/50",
              "overflow-hidden"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-linear-to-r from-violet-900/40 via-blue-900/30 to-transparent shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-linear-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-md">
                  <Sparkles size={15} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-none">IT Assistant</p>
                  <p className={cn("text-[10px] font-medium mt-0.5", anyOnline ? "text-emerald-400" : "text-slate-500")}>
                    {anyOnline
                      ? `Active · ${PROVIDER_LABELS[activeProvider] || "AI Ready"}`
                      : "All providers offline"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Provider status button */}
                <button
                  onClick={() => setShowProviders(!showProviders)}
                  className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                  title="Provider Status"
                >
                  <Server size={14} />
                </button>
                {/* Clear button */}
                <button
                  onClick={clearChat}
                  className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Clear Chat"
                >
                  <Trash2 size={14} />
                </button>
                {/* Minimize */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>

            {/* Provider Health Panel */}
            <AnimatePresence>
              {showProviders && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-slate-700/50 bg-slate-900/50 shrink-0"
                >
                  <div className="px-4 py-2.5 space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                      AI Provider Status
                    </p>
                    {(["ollama", "groq", "openrouter"] as const).map((p, i) => (
                      <div key={p} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500">#{i + 1}</span>
                          <span className="text-xs text-slate-300">{PROVIDER_LABELS[p]}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ProviderDot provider={p} health={providerHealth} />
                          <span
                            className={cn(
                              "text-[10px] font-bold",
                              providerHealth[p] ? "text-emerald-400" : "text-slate-600"
                            )}
                          >
                            {providerHealth[p] ? "Online" : "Offline"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 scroll-smooth scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-lg bg-linear-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0">
                    <Bot size={13} className="text-white" />
                  </div>
                  <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0ms]" />
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:150ms]" />
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Offline warning */}
            {!anyOnline && (
              <div className="px-3 py-2 bg-amber-900/20 border-t border-amber-800/30 shrink-0">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertCircle size={13} />
                  <p className="text-[11px] font-medium">ไม่สามารถเชื่อมต่อ AI ได้ในขณะนี้</p>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-slate-700/50 bg-slate-900/30 shrink-0">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="ถามปัญหา IT ของคุณ... (Enter ส่ง)"
                    disabled={isLoading}
                    rows={1}
                    className={cn(
                      "w-full bg-slate-800/60 border border-slate-600/50 rounded-xl px-3.5 py-2.5",
                      "text-sm text-white placeholder-slate-500",
                      "focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30",
                      "resize-none transition-all duration-200 max-h-[100px]",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                    style={{ height: "40px" }}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200",
                    input.trim() && !isLoading
                      ? "bg-linear-to-br from-violet-600 to-blue-600 text-white hover:opacity-90 active:scale-95 shadow-lg shadow-violet-500/20"
                      : "bg-slate-800 text-slate-600 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-600 mt-1.5 text-center">
                Shift+Enter เพื่อขึ้นบรรทัดใหม่
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
