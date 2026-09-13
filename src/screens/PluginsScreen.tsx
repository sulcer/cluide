import type { Plugin, WriteResult } from "@shared/api";
import { useState } from "react";
import { type ApiError, api } from "@/api/client";
import { useResource } from "@/api/useResource";
import { ProvidesBadge } from "@/components/Badge";
import { SearchInput } from "@/components/Input";
import { LoadFailed } from "@/components/LoadFailed";
import { SkeletonRows } from "@/components/Skeleton";
import { Switch } from "@/components/Switch";
import { toast } from "@/lib/toast";
import { cn } from "cn";

export function PluginsScreen() {
  const list = useResource<Plugin[]>("/api/plugins");
  const [filter, setFilter] = useState("");
  const plugins = list.data;
  const shown = plugins?.filter((p) => `${p.name} ${p.marketplace}`.toLowerCase().includes(filter.toLowerCase())) ?? [];
  const enabledCount = plugins?.filter((p) => p.enabled).length ?? 0;

  // A network failure is the shell's offline banner, not this screen's own retry state.
  if (list.error !== undefined && list.error.code !== "offline" && plugins === undefined) {
    return <LoadFailed what="Plugins" error={list.error} onRetry={list.reload} />;
  }

  const toggle = async (plugin: Plugin, enabled: boolean) => {
    try {
      const result = await api.put<WriteResult>("/api/plugins", { id: plugin.id, enabled, etag: plugin.etag });
      // Applied only after the PUT resolves (not optimistically), and via an updater rather than
      // the closed-over `plugins` snapshot, so two quick toggles can't revert each other.
      list.setData((prev) => prev?.map((p) => ({ ...p, etag: result.etag, enabled: p.id === plugin.id ? enabled : p.enabled })));
      toast({ title: `${enabled ? "Enabled" : "Disabled"} ${plugin.name}`, description: "~/.claude/settings.json → enabledPlugins" });
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 409) list.reload();
      toast({ title: "Save failed", description: err.status ? `${err.status} · ${err.message}` : err.message, error: true });
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex h-11 shrink-0 items-center gap-3 border-b px-4">
        <SearchInput className="w-[260px]" placeholder="Filter plugins" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <span className="text-xs text-muted-foreground">
          {plugins?.length ?? 0} plugins · {enabledCount} enabled
        </span>
      </div>
      {plugins === undefined ? (
        <SkeletonRows />
      ) : (
        <table className="w-full text-[13px]">
          <thead>
            <tr className="h-8 border-b text-left text-xs font-medium text-muted-foreground">
              <th className="px-4">Plugin</th>
              <th className="w-[300px]">Source</th>
              <th className="w-[90px]">Version</th>
              <th className="w-[140px]">Provides</th>
              <th className="w-24 pr-4 pl-3">Enabled</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id} className={cn("h-11 border-b hover:bg-accent", !p.enabled && "opacity-55")}>
                <td className="px-4">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-[11px] leading-4 text-muted-foreground">{p.marketplace}</div>
                </td>
                <td className="font-mono text-xs text-muted-foreground">{p.marketplaceSource ?? ""}</td>
                <td className="font-mono text-xs">{p.version}</td>
                <td>
                  <span className="flex gap-1">
                    {p.hasMcp && <ProvidesBadge>MCP</ProvidesBadge>}
                    {p.hasHooks && <ProvidesBadge>Hooks</ProvidesBadge>}
                  </span>
                </td>
                <td className="pr-4 pl-3">
                  <Switch checked={p.enabled} onCheckedChange={(v) => void toggle(p, v)} aria-label={`Enable ${p.name}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
