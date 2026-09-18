import { useEffect, useState } from "react";
import type { ApiError } from "@/api/client";
import { Button } from "@/components/Button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  body: string;
  onConfirm: () => Promise<void>;
}

export function DeleteDialog({ open, onOpenChange, name, body, onConfirm }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  useEffect(() => {
    if (open) setError(undefined);
  }, [open]);
  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (e) {
      const err = e as ApiError;
      setError(`Delete failed · ${err.status ? `${err.status} · ` : ""}${err.message}`);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="w-[440px] sm:max-w-[440px] gap-0 rounded-lg p-0">
        <div className="px-4 pt-4 pb-3">
          <DialogTitle className="text-sm font-semibold">
            Delete <span className="font-mono">{name}</span>?
          </DialogTitle>
          <DialogDescription className="mt-2 text-[13px] text-muted-foreground">
            {body} A copy is kept in ~/.cluide/backups.
          </DialogDescription>
          {error && <div className="mt-2 text-xs text-destructive">{error}</div>}
        </div>
        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
          <Button size="md" autoFocus onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="md" variant="destructive" disabled={busy} onClick={() => void confirm()}>
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
