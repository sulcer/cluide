import type { McpEntry, Scope } from "@shared/api";
import { CornerDownRight, Lock } from "lucide-react";
import { useState } from "react";
import { useLocation } from "react-router";
import { type ApiError, api, q } from "@/api/client";
import { useResource } from "@/api/useResource";
import { ScopeBadge } from "@/components/Badge";
import { LoadFailed } from "@/components/LoadFailed";
import { SkeletonRows } from "@/components/Skeleton";
import { Switch } from "@/components/ui/switch";
import { useWindowEvent } from "@/lib/events";
import { commandText, readOnly, transportOf } from "@/lib/mcp";
import { toast } from "@/lib/toast";
import { cn } from "cn";
import { McpAddDialog } from "./McpAddDialog";
import { McpSheet } from "./McpSheet";

const keyOf = (e: McpEntry) => `${e.scope}:${e.name}`;

export function McpScreen({ scope }: { scope: Scope }) {
  const location = useLocation();
  const list = useResource<McpEntry[]>(`/api/mcp${q({ scope })}`);
  const [openKey, setOpenKey] = useState<string>();
  const [adding, setAdding] = useState(() => (location.state as { primary?: boolean } | null)?.primary === true);
  useWindowEvent("cluide:primary", () => setAdding(true));
  const entries = list.data;
  const open = entries?.find((e) => keyOf(e) === openKey);
  const effective = entries?.filter((e) => e.effective).length ?? 0;

  // A network failure is the shell's offline banner, not this screen's own retry state.
  if (list.error !== undefined && list.error.code !== "offline" && entries === undefined) {
    return <LoadFailed what="MCP servers" error={list.error} onRetry={list.reload} />;
  }

  const approve = async (entry: McpEntry, enabled: boolean) => {
    try {
      await api.post("/api/mcp/approval", { scope, name: entry.name, enabled });
    } catch (e) {
      const err = e as ApiError;
      toast({ title: "Save failed", description: err.status ? `${err.status} · ${err.message}` : err.message, error: true });
      return;
    }
    // Applied only after the POST resolves (not optimistically), and via an updater rather than
    // the closed-over `entries` snapshot, so two quick toggles can't revert each other.
    list.setData((prev) => prev?.map((e) => (e === entry ? { ...e, enabled } : e)));
    toast({ title: enabled ? `Approved ${entry.name}` : `Approval removed for ${entry.name}`, description: `${scope}/.claude/settings.local.json` });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {entries === undefined ? (
        <SkeletonRows />
      ) : (
        <>
          <table className="w-full table-fixed text-[13px]">
            <thead>
              <tr className="h-8 border-b text-left text-xs font-medium text-muted-foreground">
                <th className="px-4">Name</th>
                <th className="w-24">Scope</th>
                <th className="w-22">Transport</th>
                <th className="px-3">Command or URL</th>
                <th className="w-24">Approved</th>
                <th className="w-40 pr-4 pl-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr
                  key={keyOf(e)}
                  onClick={() => setOpenKey(keyOf(e))}
                  className={cn("h-9 cursor-pointer border-b hover:bg-accent", !e.effective && "opacity-50", keyOf(e) === openKey && "selected bg-accent")}
                >
                  <td className="truncate px-4">
                    <span className="inline-flex max-w-full items-center gap-1.5 align-middle">
                      {!e.effective && <CornerDownRight className="size-4 shrink-0 text-muted-foreground" />}
                      <span className="truncate font-medium">{e.name}</span>
                      {readOnly(e) && (
                        <span title="Read-only" className="inline-flex shrink-0">
                          <Lock className="size-3.5 text-muted-foreground" aria-label="Read-only" />
                        </span>
                      )}
                    </span>
                  </td>
                  <td><ScopeBadge scope={e.scope} /></td>
                  <td className="font-mono text-xs">{transportOf(e.config)}</td>
                  <td className="truncate px-3 font-mono text-xs text-muted-foreground" title={commandText(e.config)}>{commandText(e.config)}</td>
                  <td onClick={(ev) => ev.stopPropagation()}>
                    {e.scope === "project" && (
                      <Switch checked={e.enabled === true} onCheckedChange={(v) => void approve(e, v)} aria-label={`Approve ${e.name}`} className="h-[18px] w-8 [&_[data-slot=switch-thumb]]:size-3.5" />
                    )}
                  </td>
                  <td className={cn("pr-4 pl-3", !e.effective && "text-muted-foreground")}>{e.effective ? "Effective" : `Shadowed by ${e.shadowedBy}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex h-8 items-center px-4 text-[11px] text-muted-foreground">
            {effective} effective · {entries.length - effective} shadowed · precedence local › project › user › plugin › managed
          </div>
        </>
      )}
      {open && <McpSheet key={keyOf(open)} scope={scope} entry={open} onClose={() => setOpenKey(undefined)} onChanged={list.reload} />}
      <McpAddDialog open={adding} onOpenChange={setAdding} scope={scope} onAdded={list.reload} />
    </div>
  );
}
