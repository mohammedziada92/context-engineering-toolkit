"use client";

import { useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface RunState {
  status: string;
  content: string;
  analytics: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost_usd: number;
    latency_ms: number;
    chunks_used: number;
  } | null;
  error: string | null;
  isRunning: boolean;
}

const INITIAL_STATE: RunState = {
  status: "idle",
  content: "",
  analytics: null,
  error: null,
  isRunning: false,
};

export function usePipelineRun(pipelineId: string) {
  const [state, setState] = useState<RunState>({ ...INITIAL_STATE });
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(
    async (userMessage: string, sessionId?: string) => {
      // Cancel any previous run
      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      setState({
        status: "loading",
        content: "",
        analytics: null,
        error: null,
        isRunning: true,
      });

      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          setState((s) => ({
            ...s,
            status: "error",
            error: "Not authenticated",
            isRunning: false,
          }));
          return;
        }

        const res = await fetch(
          `${API_URL}/api/v1/pipelines/${pipelineId}/run`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              user_message: userMessage,
              session_id: sessionId || undefined,
            }),
            signal: controller.signal,
          }
        );

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setState((s) => ({
            ...s,
            status: "error",
            error: body.detail ?? `Run failed: ${res.status}`,
            isRunning: false,
          }));
          return;
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text
            .split("\n")
            .filter((l) => l.startsWith("data: "));

          for (const line of lines) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.status === "done" && data.analytics) {
                setState((s) => ({
                  ...s,
                  status: "done",
                  analytics: data.analytics,
                  isRunning: false,
                }));
              } else if (data.status === "error") {
                setState((s) => ({
                  ...s,
                  status: "error",
                  error: data.error ?? "Unknown error",
                  isRunning: false,
                }));
              } else if (data.content) {
                setState((s) => ({
                  ...s,
                  content: s.content + data.content,
                }));
              } else if (data.status) {
                setState((s) => ({ ...s, status: data.status }));
              }
            } catch {
              // Skip malformed SSE lines
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setState((s) => ({
          ...s,
          status: "error",
          error: (err as Error).message ?? "Stream failed",
          isRunning: false,
        }));
      }
    },
    [pipelineId]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ ...INITIAL_STATE });
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState((s) => ({ ...s, isRunning: false }));
  }, []);

  return { ...state, run, reset, cancel };
}
