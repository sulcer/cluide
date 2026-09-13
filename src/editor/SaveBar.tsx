import { Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/Button";
import { Kbd } from "@/components/Kbd";
import { MOD } from "@/lib/keys";

interface Props {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

export function SaveBar({ dirty, saving, onSave, onDiscard }: Props) {
  if (!dirty && !saving) {
    return (
      <span className="flex shrink-0 items-center gap-1.5 text-xs whitespace-nowrap text-muted-foreground">
        <Check className="size-4" />
        Saved
      </span>
    );
  }
  return (
    <span className="flex shrink-0 items-center gap-2">
      <span className="flex items-center gap-1.5 text-xs whitespace-nowrap text-muted-foreground">
        <span className="size-1.5 rounded-full bg-foreground" />
        Unsaved changes
      </span>
      <Button variant="ghost" onClick={onDiscard}>
        Discard <Kbd>Esc</Kbd>
      </Button>
      <Button variant="primary" disabled={saving} onClick={onSave}>
        {saving && <LoaderCircle className="animate-spin" />}
        Save <Kbd onPrimary>{MOD}S</Kbd>
      </Button>
    </span>
  );
}
