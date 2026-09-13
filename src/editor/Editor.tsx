import { cn } from "cn";
import { CircleAlert } from "lucide-react";
import { type Ref, useCallback, useEffect, useRef } from "react";
import type { DraftError } from "@/hooks/useDraft";

interface Props {
  value: string;
  onChange: (value: string) => void;
  error?: DraftError;
  disabled?: boolean;
  autoFocus?: boolean;
  ref?: Ref<HTMLTextAreaElement>;
}

export function Editor({ value, onChange, error, disabled, autoFocus = true, ref }: Props) {
  const local = useRef<HTMLTextAreaElement>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: focus once on mount; a later autoFocus flip must not refocus
  useEffect(() => {
    // A closing dialog holds stale DOM focus through its exit animation, so only an open dialog counts.
    const active = document.activeElement as HTMLElement | null;
    const editorDialog = local.current?.closest('[role="dialog"]');
    const activeDialog = active?.closest('[role="dialog"]');
    const activeDialogClosing = activeDialog?.getAttribute("data-state") === "closed";
    const typing =
      !activeDialogClosing &&
      (active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active?.isContentEditable === true);
    const openDialog = document.querySelector('[role="dialog"]:not([data-state="closed"])');
    const foreignDialog = openDialog !== null && openDialog !== editorDialog;
    if (autoFocus && !typing && !foreignDialog) local.current?.focus();
  }, []);
  const setRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      local.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <textarea
        ref={setRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        spellCheck={false}
        className={cn(
          "min-h-0 flex-1 resize-none bg-transparent px-4 py-3 font-mono text-[12.5px] leading-5 outline-none [tab-size:2]",
          disabled && "opacity-60",
        )}
      />
      {error && (
        <div className="flex items-center gap-1.5 border-t px-4 py-1.5 text-xs text-destructive">
          <CircleAlert className="size-4" />
          <span className="font-medium">{error.status}</span>
          <span>·</span>
          <span className="font-mono">{error.message}</span>
        </div>
      )}
    </div>
  );
}
