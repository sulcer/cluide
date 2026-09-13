import { CircleAlert } from "lucide-react";
import type { Ref } from "react";
import { cn } from "cn";
import type { DraftError } from "./useDraft";

interface Props {
  value: string;
  onChange: (value: string) => void;
  error?: DraftError;
  disabled?: boolean;
  autoFocus?: boolean;
  ref?: Ref<HTMLTextAreaElement>;
}

export function Editor({ value, onChange, error, disabled, autoFocus = true, ref }: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        autoFocus={autoFocus}
        spellCheck={false}
        className={cn("min-h-0 flex-1 resize-none bg-transparent px-4 py-3 font-mono text-[12.5px] leading-5 [tab-size:2]", disabled && "opacity-60")}
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
