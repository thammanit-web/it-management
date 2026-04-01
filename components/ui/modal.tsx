"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Modal({ isOpen, onClose, title, children, className, size = 'md' }: ModalProps) {
  // Prevent scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
             className={cn(
               "relative w-full overflow-hidden transition-colors",
               size === 'sm' && "sm:max-w-sm",
               size === 'md' && "sm:max-w-lg",
               size === 'lg' && "sm:max-w-2xl",
               size === 'xl' && "sm:max-w-4xl",
               size === 'full' && "sm:max-w-[95vw]",
               "rounded-t-2xl sm:rounded-2xl",
               "bg-surface border-t sm:border border-border shadow-2xl",
               className
             )}
          >
            <div className="flex items-center justify-between border-b border-border px-5 sm:px-6 py-4">
              <h2 className="text-lg font-bold text-foreground tracking-tight leading-tight capitalize">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-accent hover:bg-secondary hover:text-foreground transition-all shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 sm:p-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
