import type { SchemaError } from "@shared/api";
import { Check, TriangleAlert } from "lucide-react";
import { CountBadge, DashedBadge } from "@/components/Badge";

interface Props { errors: SchemaError[]; unavailable: boolean; onJump: (pointer: string) => void }

export function WarningsPanel({ errors, unavailable, onJump }: Props) {
  return (
    <aside aria-label="Warnings" className="flex h-[180px] shrink-0 flex-col border-t min-[1200px]:h-auto min-[1200px]:w-80 min-[1200px]:border-t-0 min-[1200px]:border-l">
      <div className="flex h-8 shrink-0 items-center gap-2 px-3 text-xs font-medium">
        Warnings
        <CountBadge count={errors.length} />
        {unavailable && (
          <DashedBadge title="Last fetch failed. Validated against the cached copy.">
            <TriangleAlert />
            Schema unavailable
          </DashedBadge>
        )}
        <div className="flex-1" />
        {!unavailable && <span className="text-[11px] font-normal text-muted-foreground">schemastore.org</span>}
      </div>
      {errors.length === 0 ? (
        <div className="flex items-center gap-2 px-3 py-4 text-xs text-muted-foreground">
          <Check className="size-4 text-success" />
          Valid against the published schema
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {errors.map((e, i) => (
            <button key={i} type="button" onClick={() => onJump(e.path)} className="block w-full border-b px-3 py-1.5 text-left hover:bg-accent">
              <div className="font-mono text-xs">{e.path || "/"}</div>
              <div className="text-xs text-muted-foreground">{e.message}</div>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
