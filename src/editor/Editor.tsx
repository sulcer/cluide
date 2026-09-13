import { CircleAlert } from "lucide-react";
import { type Ref, useCallback, useEffect, useRef } from "react";
import { cn } from "cn";
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
  useEffect(() => {
    // Autofocus only when nothing that matters has focus. A field that is mid-typing (the
    // new-file input, another editor) must not be interrupted by a late-mounting editor (its
    // data arrived after the field was focused). A dialog that does not contain this editor (the
    // command menu, a conflict) also keeps focus; a dialog that does contain it (the MCP sheet)
    // does not block, so the editor still focuses itself when it is the thing that opened. A
    // closing dialog stays mounted with data-state="closed" for its exit animation, so only an
    // open one counts — for both the dialog check and for what "typing" means: a command-menu
    // "Open file" selection navigates while the menu's own input still holds DOM focus through its
    // exit animation, and that stale focus must not block the file's editor from taking it.
    const active = document.activeElement as HTMLElement | null;
    const editorDialog = local.current?.closest('[role="dialog"]');
    const activeDialog = active?.closest('[role="dialog"]');
    const activeDialogClosing = activeDialog?.getAttribute("data-state") === "closed";
    const typing = !activeDialogClosing && (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active?.isContentEditable === true);
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
        className={cn("min-h-0 flex-1 resize-none bg-transparent px-4 py-3 font-mono text-[12.5px] leading-5 outline-none [tab-size:2]", disabled && "opacity-60")}
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
