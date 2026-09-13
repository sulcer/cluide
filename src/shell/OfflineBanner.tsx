import { CircleAlert } from "lucide-react";
import { Button } from "@/components/Button";
import { emit } from "@/lib/events";

export function OfflineBanner() {
  return (
    <div className="flex h-9 shrink-0 items-center gap-2 border-b bg-muted px-3 text-xs">
      <CircleAlert className="size-4 text-destructive" />
      <span>
        cluide server is not running. Start it with{" "}
        <code className="rounded-sm bg-secondary px-[5px] py-px font-mono">bun run start</code>
      </span>
      <div className="flex-1" />
      <Button size="xs" onClick={() => emit("cluide:retry")}>Retry</Button>
    </div>
  );
}
