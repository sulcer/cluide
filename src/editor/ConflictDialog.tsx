import { TriangleAlert } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/Button";
import { Kbd } from "@/components/Kbd";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { Conflict } from "./useDraft";

interface Props { conflict: Conflict | undefined; name: string; path: string; onReload: () => void; onOverwrite: () => void; onDismiss: () => void }

export function ConflictDialog({ conflict, name, path, onReload, onOverwrite, onDismiss }: Props) {
  const reloadButton = useRef<HTMLButtonElement>(null);
  return (
    <Dialog open={conflict !== undefined} onOpenChange={(open) => { if (!open) onDismiss(); }}>
      <DialogContent
        showCloseButton={false}
        className="w-[440px] sm:max-w-[440px] gap-0 rounded-lg p-0"
        onOpenAutoFocus={(e) => {
          e.preventDefault(); // Radix would focus Overwrite, the first tabbable; the spec gives Reload the focus
          reloadButton.current?.focus();
        }}
      >
        <div className="px-4 pt-4 pb-3">
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <TriangleAlert className="size-4 text-warning" />
            <span className="font-mono font-medium">{name}</span> changed on disk
          </DialogTitle>
          <DialogDescription className="mt-2 text-[13px] text-muted-foreground">
            Another process wrote <span className="font-mono">{path}</span> after you opened it.{" "}
            <span className="text-foreground">Reload</span> drops your edits and loads the file.{" "}
            <span className="text-foreground">Overwrite</span> replaces what is on disk with your version.
          </DialogDescription>
        </div>
        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
          <Button size="md" onClick={onOverwrite}>Overwrite</Button>
          <Button size="md" variant="primary" ref={reloadButton} onClick={onReload}>
            Reload <Kbd onPrimary>↵</Kbd>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
