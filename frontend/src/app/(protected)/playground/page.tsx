"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSessions,
  createSession,
  getMessages,
  addMessage,
} from "@/lib/api/playground";
import { SUPPORTED_MODELS } from "@/lib/api/settings";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Plus,
  Send,
  Loader2,
  Clock,
  Coins,
  Zap,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const MODEL_BADGES: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  "anthropic/claude-sonnet-4-6": { label: "Quality", variant: "default" },
  "z-ai/glm-5": { label: "Agent", variant: "secondary" },
  "google/gemini-3.1-pro-preview": { label: "Budget", variant: "outline" },
};

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: string;
  analytics?: {
    total_tokens: number;
    cost_usd: number;
    latency_ms: number;
  };
}

// ── Streaming dots ────────────────────────────────────────────

function StreamingDots() {
  return (
    <span className="inline-flex gap-0.5">
      <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
      <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
      <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function PlaygroundPage() {
  const queryClient = useQueryClient();

  // State
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [model, setModel] = useState<string>(SUPPORTED_MODELS[0].id);
  const handleModelChange = (v: string | null) => {
    if (v) setModel(v);
  };
  const [systemPrompt, setSystemPrompt] = useState("");
  const [inputText, setInputText] = useState("");
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Queries ──────────────────────────────────────────────

  const { data: sessions } = useQuery({
    queryKey: ["playground-sessions"],
    queryFn: getSessions,
  });

  const { data: messages } = useQuery({
    queryKey: ["playground-messages", activeSessionId],
    queryFn: () => (activeSessionId ? getMessages(activeSessionId) : []),
    enabled: !!activeSessionId,
  });

  // ── Sync API messages → display messages ──────────────────

  useEffect(() => {
    if (!messages || isStreaming) return;
    setDisplayMessages(
      messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
      }))
    );
    setStreamError(null);
  }, [messages, isStreaming]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages]);

  // ── Mutations ─────────────────────────────────────────────

  const createSessionMutation = useMutation({
    mutationFn: () => createSession(),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["playground-sessions"] });
      setActiveSessionId(session.id);
    },
  });

  // ── Send message + stream ─────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isStreaming) return;

    // Create session if none active
    let sessionId = activeSessionId;
    if (!sessionId) {
      const session = await createSession();
      sessionId = session.id;
      setActiveSessionId(sessionId);
      queryClient.invalidateQueries({ queryKey: ["playground-sessions"] });
    }

    // Add user message to display
    const userMsg: DisplayMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: text,
    };
    setDisplayMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsStreaming(true);
    setStreamError(null);

    // Save user message to backend
    addMessage(sessionId, "user", text).catch(() => {});

    // Build messages array for API
    const apiMessages = [
      ...displayMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: text },
    ];

    // SSE stream
    const assistantMsg: DisplayMessage = {
      id: `stream-${Date.now()}`,
      role: "assistant",
      content: "",
      model,
    };
    setDisplayMessages((prev) => [...prev, assistantMsg]);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const supabase = createClient();
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();

      if (!authSession?.access_token) {
        setStreamError("Not authenticated");
        setIsStreaming(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/v1/playground/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({
          model,
          messages: apiMessages,
          system_prompt: systemPrompt || undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setStreamError(body.detail ?? `Run failed: ${res.status}`);
        setIsStreaming(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.status === "done" && data.analytics) {
              setDisplayMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === "assistant") {
                  updated[updated.length - 1] = {
                    ...last,
                    analytics: data.analytics,
                  };
                }
                return updated;
              });
              // Save assistant message
              const lastContent = displayMessages;
              setDisplayMessages((current) => {
                const last = current[current.length - 1];
                if (last?.role === "assistant") {
                  addMessage(sessionId!, "assistant", last.content).catch(
                    () => {}
                  );
                }
                return current;
              });
            } else if (data.status === "error") {
              setStreamError(data.error ?? "Unknown error");
            } else if (data.content) {
              setDisplayMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === "assistant") {
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + data.content,
                  };
                }
                return updated;
              });
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setStreamError((err as Error).message ?? "Stream failed");
    } finally {
      setIsStreaming(false);
    }
  }, [
    inputText,
    isStreaming,
    activeSessionId,
    model,
    systemPrompt,
    displayMessages,
    queryClient,
  ]);

  // ── Select session ────────────────────────────────────────

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    setDisplayMessages([]);
    setStreamError(null);
  };

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-3rem)] -m-6">
      {/* Left panel — Sessions */}
      <div className="w-80 shrink-0 border-r border-border bg-card flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Sessions</h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => createSessionMutation.mutate()}
            disabled={createSessionMutation.isPending}
          >
            {createSessionMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Plus className="size-3.5" />
            )}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessions && sessions.length > 0 ? (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectSession(s.id)}
                className={`w-full text-left px-4 py-2.5 text-sm border-b border-border transition-colors ${
                  activeSessionId === s.id
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <span className="truncate block">{s.name}</span>
                <span className="text-[10px] text-muted-foreground/70">
                  {new Date(s.updated_at).toLocaleDateString()}
                </span>
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <MessageSquare className="size-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">No sessions yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Center panel — Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {displayMessages.length === 0 && !isStreaming ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <MessageSquare className="size-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Start a conversation
              </p>
              <p className="text-xs text-muted-foreground/60">
                Select a model and type your message below
              </p>
            </div>
          ) : (
            displayMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-3.5 py-2.5 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border"
                  }`}
                >
                  {msg.role === "assistant" && msg.model && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Badge
                        variant={
                          MODEL_BADGES[msg.model]?.variant ?? "outline"
                        }
                        className="text-[10px]"
                      >
                        {MODEL_BADGES[msg.model]?.label ?? msg.model}
                      </Badge>
                    </div>
                  )}

                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.content || (isStreaming ? "" : "")}
                  </p>

                  {msg.role === "assistant" &&
                    !msg.content &&
                    isStreaming && <StreamingDots />}

                  {msg.role === "assistant" && msg.analytics && (
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/50">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Zap className="size-2.5" />
                        {msg.analytics.total_tokens.toLocaleString()} tokens
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Coins className="size-2.5" />$
                        {msg.analytics.cost_usd.toFixed(4)}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="size-2.5" />
                        {msg.analytics.latency_ms.toLocaleString()}ms
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Error */}
          {streamError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 max-w-[70%]">
              <p className="text-xs text-destructive font-medium">
                Run failed
              </p>
              <p className="text-xs text-destructive/80 mt-0.5">
                {streamError}
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="px-6 py-3 border-t border-border bg-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-end gap-2"
          >
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message..."
              disabled={isStreaming}
              rows={1}
              className="flex-1 resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 outline-none max-h-32"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!inputText.trim() || isStreaming}
              className="shrink-0"
            >
              {isStreaming ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Right panel — Settings */}
      <div className="w-72 shrink-0 border-l border-border bg-card flex flex-col">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Settings</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Model selector */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Model
            </label>
            <Select value={model} onValueChange={handleModelChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="flex items-center gap-2">
                      {m.label}
                      <Badge
                        variant={MODEL_BADGES[m.id]?.variant ?? "outline"}
                        className="text-[9px] ml-1"
                      >
                        {m.id.split("/")[1]}
                      </Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* System prompt */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              System Prompt
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Optional system prompt..."
              rows={6}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 resize-none outline-none"
            />
          </div>

          {/* Info */}
          <div className="rounded-lg border border-border p-3 space-y-1.5">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Current Model
            </p>
            <p className="text-sm text-foreground">
              {SUPPORTED_MODELS.find((m) => m.id === model)?.label}
            </p>
            <Badge
              variant={MODEL_BADGES[model]?.variant ?? "outline"}
              className="text-[10px]"
            >
              {model.split("/")[1]}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
