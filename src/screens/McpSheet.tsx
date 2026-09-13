import type { McpConfig, McpEntry, Scope, WriteResult } from "@shared/api";
import { Lock, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ApiError, api, q } from "@/api/client";
import { DashedBadge, ScopeBadge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { ConflictDialog } from "@/editor/ConflictDialog";
import { DeleteDialog } from "@/editor/DeleteDialog";
import { DiffSheet } from "@/editor/DiffSheet";
import { Editor } from "@/editor/Editor";
import { SaveBar } from "@/editor/SaveBar";
import { type Loaded, type SaveFn, useDraft } from "@/hooks/useDraft";
import { jsonText } from "@/lib/json";
import { readOnly } from "@/lib/mcp";
import { toast } from "@/lib/toast";

interface Props { scope: Scope; entry: McpEntry; onClose: () => void; onChanged: () => void }

export function McpSheet({ scope, entry, onClose, onChanged }: Props) {
  const ro = readOnly(entry);
  const loaded = useMemo<Loaded>(() => ({ content: jsonText(entry.config), etag: entry.etag }), [entry]);
  const [deleting, setDeleting] = useState(false);

  const save: SaveFn = async (content, etag) => {
    let config: McpConfig;
    try {
      config = JSON.parse(content);
    } catch {
      throw new ApiError(422, "unprocessable", "config must be valid JSON");
    }
    const result = await api.put<WriteResult>("/api/mcp", { scope, target: entry.scope, name: entry.name, config, etag });
    onChanged();
    return result;
  };
  const draft = useDraft(loaded, save, entry.name, {
    savedDescription: entry.name,
    conflictOf: (current) => {
      const c = current as { content: Record<string, unknown> | null; etag: string };
      return { content: jsonText(c.content?.[entry.name] ?? {}), etag: c.etag };
    },
  });

  const remove = async () => {
    await api.del(`/api/mcp${q({ scope, target: entry.scope, name: entry.name, etag: draft.etag ?? undefined })}`);
    toast({ title: `Deleted ${entry.name}`, description: "backup in ~/.cluide/backups" });
    onClose();
    onChanged();
  };

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" showCloseButton={false} className="flex w-[520px] max-w-full flex-col gap-0 border-l bg-background p-0 shadow-float sm:max-w-[520px]">
        <div className="flex items-start gap-2 px-4 pt-3.5 pb-3">
          <div className="min-w-0 flex-1">
            <SheetTitle className="flex items-center gap-2 text-[13px] font-medium">
              {entry.name}
              <ScopeBadge scope={entry.scope} />
              {ro && (
                <DashedBadge>
                  <Lock />
                  Read-only
                </DashedBadge>
              )}
            </SheetTitle>
            <SheetDescription className="truncate font-mono text-xs text-muted-foreground">{entry.file}</SheetDescription>
          </div>
          <SheetClose asChild>
            <IconButton label="Close">
              <X />
            </IconButton>
          </SheetClose>
        </div>
        <div className="flex h-9 shrink-0 items-center px-4 text-xs text-muted-foreground">
          Config
          <div className="flex-1" />
          <SaveBar dirty={draft.dirty} saving={draft.saving} onSave={draft.save} onDiscard={draft.discard} />
        </div>
        <Editor value={draft.content} onChange={draft.setContent} error={draft.error} disabled={ro} autoFocus={!ro} />
        {ro && (
          <div className="px-4 py-2 text-xs text-muted-foreground">
            {entry.scope === "plugin" ? "Defined by the plugin. Disable the plugin to remove it." : "Managed by your organisation in settings.json → managedMcpServers."}
          </div>
        )}
        <div className="flex items-center gap-2 border-t px-4 py-3">
          {!ro && (
            <Button variant="ghost-destructive" onClick={() => setDeleting(true)}>
              <Trash2 />
              Delete
            </Button>
          )}
          <div className="flex-1" />
          <SheetClose asChild>
            <Button>Close</Button>
          </SheetClose>
        </div>
        <DiffSheet open={draft.diffOpen} onOpenChange={draft.setDiffOpen} name={entry.name} path={entry.file} diff={draft.diff} />
        <ConflictDialog conflict={draft.conflict} name={entry.name} path={entry.file} onReload={draft.reload} onOverwrite={draft.overwrite} onDismiss={draft.dismissConflict} />
        <DeleteDialog open={deleting} onOpenChange={setDeleting} name={entry.name} body={`This removes the server from ${entry.file}.`} onConfirm={remove} />
      </SheetContent>
    </Sheet>
  );
}
