import { Check, CircleAlert, X } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { dismiss } from "@/lib/toast";

export function Toaster() {
  const t = useToast();
  if (t === null) return null;
  return (
    <div
      role="status"
      className="fixed right-4 bottom-4 z-50 flex min-w-[280px] max-w-[420px] items-start gap-2.5 rounded-lg border bg-popover px-3 py-2.5 text-[13px] shadow-float"
    >
      {t.error ? <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" /> : <Check className="mt-0.5 size-4 shrink-0 text-success" />}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="truncate">{t.title}</span>
          {t.action && (
            <>
              <span className="text-muted-foreground">·</span>
              <button type="button" className="h-6 rounded-sm px-1 text-link hover:bg-accent" onClick={t.action.run}>
                {t.action.label}
              </button>
            </>
          )}
        </div>
        {t.description && <div className="truncate font-mono text-xs text-muted-foreground">{t.description}</div>}
      </div>
      <button type="button" aria-label="Dismiss" className="flex size-6 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground" onClick={dismiss}>
        <X className="size-4" />
      </button>
    </div>
  );
}
