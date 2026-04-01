import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorComponentProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorComponent({ 
  title = "Something went wrong", 
  message = "An error occurred while loading your content. Please try again later.", 
  onRetry, 
  className 
}: ErrorComponentProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-danger/20 bg-danger/5 transition-all animate-in fade-in zoom-in-95",
      className
    )}>
      <div className="h-14 w-14 mb-4 rounded-xl bg-danger/10 flex items-center justify-center text-danger">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-1 capitalize tracking-tight">{title}</h3>
      <p className="text-sm font-medium text-accent max-w-sm mb-6 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-danger text-white font-bold hover:bg-danger/90 transition-all active:scale-95 shadow-md shadow-danger/20"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Retry now</span>
        </button>
      )}
    </div>
  );
}
