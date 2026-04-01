import { ReactNode } from "react";
import { SearchIcon, PlusCircle, PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ 
  title, 
  description, 
  icon, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border bg-surface/50 transition-colors",
      className
    )}>
      <div className="h-16 w-16 mb-4 rounded-2xl bg-secondary/30 flex items-center justify-center text-accent">
        {icon || <PackageOpen className="h-8 w-8" />}
      </div>
      <h3 className="text-lg font-bold text-foreground mb-1 capitalize">{title}</h3>
      {description && (
        <p className="text-sm font-medium text-accent max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <div className="flex justify-center">
           {action}
        </div>
      )}
    </div>
  );
}

export function NoResultsState({ query, onClear }: { query: string; onClear?: () => void }) {
  return (
    <EmptyState
      title="No results found"
      description={`We couldn't find any information matches for "${query}". Please check your search terms or try another keywords.`}
      icon={<SearchIcon className="h-8 w-8" />}
      action={onClear && (
        <button 
          onClick={onClear}
          className="text-sm font-bold text-primary hover:underline transition-all"
        >
          Clear filters
        </button>
      )}
    />
  );
}
