import { useImperativeHandle, forwardRef } from "react";
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAISuggest } from "@/hooks/useAISuggest";

const CATEGORY_COLORS: Record<string, string> = {
  HARDWARE: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  SOFTWARE: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  NETWORK: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  GENERAL: "bg-slate-500/10 text-slate-400 border-slate-500/30",
};

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  LOW: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
};

const PROVIDER_LABELS: Record<string, string> = {
  ollama: "Ollama",
  groq: "Groq",
  openrouter: "OpenRouter",
};

interface AICategorizeSuggestProps {
  type_request: string;
  description: string;
  reason?: string;
  onApply: (category: string, priority: string) => void;
  className?: string;
}

export interface AICategorizeSuggestHandle {
  runClassify: () => Promise<{ category: string; priority: string; reasoning?: string } | null>;
}

export const AICategorizeSuggest = forwardRef<AICategorizeSuggestHandle, AICategorizeSuggestProps>(
  ({ type_request, description, reason, onApply, className }, ref) => {
    const { suggest, suggestion, isLoading, error } = useAISuggest();

    useImperativeHandle(ref, () => ({
      runClassify: async () => {
        if (!type_request || !description || description.length < 5) return null;
        
        const result = await suggest(type_request, description, reason);
        if (result) {
          onApply(result.category, result.priority);
          return { category: result.category, priority: result.priority, reasoning: result.reasoning };
        }
        return null;
      }
    }));

    return (
      <div className={cn("space-y-2", className)}>
        {/* Loading / Success Status */}
        <div className="flex items-center gap-2 h-6">
          {isLoading ? (
            <div className="flex items-center gap-2 animate-pulse">
              <Loader2 size={12} className="animate-spin text-violet-400" />
              <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
                AI กำลังจำแนกประเภทข้อมูล...
              </span>
            </div>
          ) : suggestion ? (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
              <Sparkles size={12} className="text-violet-400" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                AI จำแนกประเภทเรียบร้อยแล้ว
              </span>
            </div>
          ) : null}
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
            <AlertCircle size={12} />
            <span>AI Assist: {error}</span>
          </div>
        )}

        {/* Results Reasoning */}
        {suggestion && (
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                  AI Classification Result
                </span>
              </div>
              <span className="text-[9px] text-zinc-400 font-mono">
                {PROVIDER_LABELS[suggestion.provider] || suggestion.provider}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Category</p>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold border",
                  CATEGORY_COLORS[suggestion.category] || CATEGORY_COLORS.GENERAL
                )}>
                  {suggestion.category}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Priority</p>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold border",
                  PRIORITY_COLORS[suggestion.priority] || PRIORITY_COLORS.MEDIUM
                )}>
                  {suggestion.priority}
                </span>
              </div>
            </div>

            {suggestion.reasoning && (
              <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-700/50 pt-2 italic">
                {suggestion.reasoning}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

AICategorizeSuggest.displayName = "AICategorizeSuggest";

