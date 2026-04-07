"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
  direction?: "right" | "top" | "bottom";
}

const sizes = {
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  full: "max-w-full",
};

const heights = {
  md: "max-h-[50vh]",
  lg: "max-h-[70vh]",
  xl: "max-h-[85vh]",
  "2xl": "max-h-[85vh]",
  "3xl": "max-h-[85vh]",
  "4xl": "max-h-[85vh]",
  "5xl": "max-h-[85vh]",
  full: "max-h-full",
};

export function Drawer({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = "md",
  direction = "right" 
}: DrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const isVertical = direction === "top" || direction === "bottom";

  const initial = direction === "right" ? { x: "100%" } : 
                  direction === "top" ? { y: "-100%" } : { y: "100%" };
  
  const animate = direction === "right" ? { x: 0 } : { y: 0 };
  
  const exit = direction === "right" ? { x: "100%" } : 
               direction === "top" ? { y: "-100%" } : { y: "100%" };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          <div className={cn(
             "absolute flex max-w-full",
             direction === "right" && "inset-y-0 right-0 pl-10",
             direction === "top" && "inset-x-0 top-0 pb-10",
             direction === "bottom" && "inset-x-0 bottom-0 pt-10"
          )}>
            <motion.div
              initial={initial}
              animate={animate}
              exit={exit}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={cn(
                "w-screen pointer-events-auto", 
                !isVertical ? sizes[size] : "w-full mx-auto",
                isVertical && "max-w-5xl"
              )}
            >
              <div className={cn(
                "flex flex-col bg-surface shadow-2xl border-border transition-colors",
                direction === "right" && "h-full border-l",
                direction === "top" && "rounded-b-xl border-b shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)]",
                direction === "bottom" && "rounded-t-xl border-t h-auto"
              )}>
                <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                  <h2 className="text-lg font-bold text-foreground capitalize tracking-tight">{title}</h2>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl hover:bg-secondary text-accent hover:text-foreground transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className={cn(
                   "relative flex-1 overflow-y-auto px-6 py-6 custom-scrollbar",
                   isVertical && heights[size]
                )}>
                  {children}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
