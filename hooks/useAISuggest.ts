"use client";

import { useState } from "react";

export type AISuggestion = {
  category: "HARDWARE" | "SOFTWARE" | "NETWORK" | "GENERAL";
  priority: "LOW" | "MEDIUM" | "HIGH";
  reasoning: string;
  provider: string;
  model: string;
};

type UseAISuggestReturn = {
  suggest: (type_request: string, description: string, reason?: string) => Promise<AISuggestion | null>;
  suggestion: AISuggestion | null;
  isLoading: boolean;
  error: string | null;
  clear: () => void;
};

export function useAISuggest(): UseAISuggestReturn {
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggest = async (
    type_request: string,
    description: string,
    reason?: string
  ): Promise<AISuggestion | null> => {
    if (!type_request || !description || description.length < 5) return null;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type_request, description, reason }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "AI suggestion failed");
      }

      const data: AISuggestion = await res.json();
      setSuggestion(data);
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clear = () => {
    setSuggestion(null);
    setError(null);
  };

  return { suggest, suggestion, isLoading, error, clear };
}
