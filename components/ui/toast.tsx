"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  title?: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextType {
  toast: (payload: { title?: string; message: string; variant?: ToastVariant; duration?: number }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(({ title, message, variant = "success", duration = 3000 }: { title?: string; message: string; variant?: ToastVariant; duration?: number }) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, title, message, variant }]);
    setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-9999 flex flex-col gap-3 w-full max-w-[400px] pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1 } }}
              className="pointer-events-auto"
            >
              <ToastItem toast={t} onClose={() => removeToast(t.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const variants = {
  success: "bg-white border-success/30 border-l-4 border-l-success text-success shadow-lg shadow-success/10",
  error: "bg-white border-danger/30 border-l-4 border-l-danger text-danger shadow-lg shadow-danger/10",
  warning: "bg-white border-warning/30 border-l-4 border-l-warning text-warning shadow-lg shadow-warning/10",
  info: "bg-white border-primary/30 border-l-4 border-l-primary text-primary shadow-lg shadow-primary/10",
};

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const Icon = icons[toast.variant];
  
  return (
    <div className={cn(
      "relative w-full rounded-xl p-4 flex gap-4 transition-colors",
      variants[toast.variant]
    )}>
      <div className="shrink-0 h-10 w-10 rounded-lg bg-current/10 flex items-center justify-center">
         <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0 pr-6">
        {toast.title && <p className="font-bold text-sm text-foreground mb-0.5 capitalize">{toast.title}</p>}
        <p className="text-sm font-medium text-accent leading-relaxed">{toast.message}</p>
      </div>
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-1 hover:bg-secondary rounded-lg text-accent transition-all"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
