import { cn } from "cn";
import { X } from "lucide-react";
import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { parseUnifiedDiff } from "@/lib/diff";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  path: string;
  diff: string;
}

export function DiffSheet({ open, onOpenChange, name, path, diff }: Props) {
  const parsed = parseUnifiedDiff(diff);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-[520px] max-w-full flex-col gap-0 border-l bg-background p-0 shadow-float sm:max-w-[520px]"
      >
        <div className="flex items-start gap-3 px-4 pt-3.5 pb-3">
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-[13px] font-medium">Diff · {name}</SheetTitle>
            <SheetDescription className="truncate font-mono text-xs text-muted-foreground">{path}</SheetDescription>
          </div>
          <SheetClose asChild>
            <IconButton label="Close">
              <X />
            </IconButton>
          </SheetClose>
        </div>
        <div className="min-h-0 flex-1 overflow-auto py-2 font-mono text-xs leading-5">
          {parsed.lines.map((l, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                l.kind === "add" && "bg-diff-add",
                l.kind === "del" && "bg-diff-del",
                l.kind === "meta" && "text-muted-foreground",
              )}
            >
              <span className="w-10 shrink-0 pr-1 text-right opacity-70">{l.old ?? ""}</span>
              <span className="w-10 shrink-0 pr-1 text-right opacity-70">{l.new ?? ""}</span>
              <span className="w-3.5 shrink-0 text-center">{l.sign}</span>
              <span className="pr-4 whitespace-pre">{l.text}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t px-4 py-3 text-xs text-muted-foreground">
          <span className="text-success">+{parsed.added}</span>
          <span className="text-destructive">−{parsed.removed}</span>
          <span>· backup in ~/.cluide/backups</span>
          <div className="flex-1" />
          <SheetClose asChild>
            <Button>Close</Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
