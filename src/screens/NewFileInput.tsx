import type { FileKind } from "@shared/api";
import { FileText } from "lucide-react";
import { useState } from "react";

const SUFFIX: Partial<Record<FileKind, string>> = { skills: "/SKILL.md", hooks: ".sh" };

interface Props {
  kind: FileKind;
  onCreate: (name: string) => Promise<void>;
  onCancel: () => void;
}

export function NewFileInput({ kind, onCreate, onCancel }: Props) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const suffix = SUFFIX[kind] ?? ".md";

  const onKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation(); // the editor's Esc must not discard while this input is open
      onCancel();
    } else if (e.key === "Enter" && name.trim() !== "" && !busy) {
      setBusy(true);
      try {
        await onCreate(name.trim() + suffix);
      } finally {
        setBusy(false);
      }
    }
  };

  return (
    <div className="px-2 pt-2">
      <div className="flex h-8 items-center gap-2 rounded-sm border border-ring bg-background px-2">
        <FileText className="size-4 shrink-0 text-muted-foreground" />
        <input
          // biome-ignore lint/a11y/noAutofocus: the input appears on the user's own New action
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="name"
          className="min-w-0 flex-1 bg-transparent font-mono text-xs outline-none placeholder:text-muted-foreground"
        />
        <span className="font-mono text-xs text-muted-foreground">{suffix}</span>
      </div>
    </div>
  );
}
