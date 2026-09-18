import type { FileEntry, FileKind } from "@shared/api";
import { cn } from "cn";
import { FileCode, FileText, Folder } from "lucide-react";
import { useEffect, useState } from "react";
import { SearchInput } from "@/components/Input";
import { SkeletonRows } from "@/components/Skeleton";
import { NewFileInput } from "./NewFileInput";

interface Props {
  kind: FileKind;
  entries: FileEntry[] | undefined;
  selected: FileEntry | undefined;
  // focus defaults true (a click); j/k passes false so keyboard browsing never steals focus into the editor.
  onSelect: (entry: FileEntry, focus?: boolean) => void;
  creating: boolean;
  onCreate: (name: string) => Promise<void>;
  onCancelCreate: () => void;
}

export function FileList({ kind, entries, selected, onSelect, creating, onCreate, onCancelCreate }: Props) {
  const [filter, setFilter] = useState("");
  const filterable = entries !== undefined && entries.length > 12;
  const shown = (entries ?? []).filter((e) => e.name.toLowerCase().includes(filter.toLowerCase()));
  const Icon = kind === "skills" ? Folder : kind === "hooks" ? FileCode : FileText;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key !== "j" && e.key !== "k") || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      // An open dialog must keep j/k from moving the selection and remounting the editor beneath it.
      if (document.querySelector('[role="dialog"]:not([data-state="closed"])')) return;
      const i = shown.findIndex((x) => x.path === selected?.path);
      const next = shown[i + (e.key === "j" ? 1 : -1)];
      if (next) {
        e.preventDefault();
        onSelect(next, false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown, selected, onSelect]);

  return (
    <div className="flex w-60 shrink-0 flex-col border-r">
      {creating && <NewFileInput kind={kind} onCreate={onCreate} onCancel={onCancelCreate} />}
      {filterable && (
        <div className="px-2 pt-2">
          <SearchInput placeholder="Filter" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
      )}
      {entries === undefined ? (
        <SkeletonRows />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {shown.map((e) => (
            <button
              key={e.path}
              type="button"
              onClick={() => onSelect(e)}
              className={cn(
                "flex h-8 w-full min-w-0 items-center gap-2 rounded-sm px-2 text-left hover:bg-accent",
                e.path === selected?.path && "selected bg-secondary",
              )}
            >
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">
                {kind === "skills" ? (
                  <>
                    {e.name.replace(/\/SKILL\.md$/, "")}
                    <span className="text-muted-foreground">/SKILL.md</span>
                  </>
                ) : (
                  e.name
                )}
              </span>
            </button>
          ))}
        </div>
      )}
      {filterable && (
        <div className="flex h-7 shrink-0 items-center border-t px-2 text-[11px] text-muted-foreground">
          {shown.length} {kind}
        </div>
      )}
    </div>
  );
}
