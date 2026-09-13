import type { FileEntry, Scope, SettingsDoc } from "@shared/api";
import { ArrowRight, FileCode } from "lucide-react";
import { Link } from "react-router";
import { q } from "@/api/client";
import { useResource } from "@/api/useResource";
import { Centered } from "@/components/Centered";
import { SkeletonRows } from "@/components/Skeleton";
import { flattenHooks, language, scriptFor } from "@/lib/hooks";
import { screenUrl, scopeUrl } from "@/lib/routes";

export function HooksScreen({ scope }: { scope: Scope }) {
  const settings = useResource<SettingsDoc>(`/api/settings${q({ scope, file: "settings" })}`);
  const local = useResource<SettingsDoc>(`/api/settings${q({ scope, file: "local" })}`);
  const scripts = useResource<FileEntry[]>(`/api/files${q({ scope, kind: "hooks" })}`);
  if (settings.data === undefined || local.data === undefined || scripts.data === undefined) return <SkeletonRows />;

  const docs = [settings.data, local.data];
  const rows = docs.flatMap((d) => flattenHooks(d.json, d.path));
  const sources = docs.filter((d) => d.json !== null && d.json.hooks !== undefined).map((d) => d.path);
  const scriptUrl = (name: string) => `${scopeUrl(scope)}/hooks/${encodeURIComponent(name)}`;
  const settingsLink = (text: string) => (
    <Link to={screenUrl(scope, "settings")} className="text-link underline underline-offset-2">{text}</Link>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {rows.length === 0 ? (
        <Centered title="No hooks in this scope">
          <span className="text-xs text-muted-foreground">
            Hooks are the <code className="font-mono">hooks</code> key of {settingsLink("settings.json")}
          </span>
        </Centered>
      ) : (
        <>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="h-8 border-b text-left text-xs font-medium text-muted-foreground">
                <th className="w-[180px] px-4">Event</th>
                <th className="w-[140px] px-4">Matcher</th>
                <th className="px-4">Command</th>
                <th className="w-[120px] px-4">Type</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const script = scriptFor(r.command, scripts.data!);
                return (
                  <tr key={i} className="h-9 border-b hover:bg-accent">
                    <td className="px-4 font-medium">{r.event}</td>
                    <td className="px-4 font-mono text-xs">{r.matcher}</td>
                    <td className="px-4 font-mono text-xs">
                      {script ? (
                        <Link to={scriptUrl(script.name)} title={r.command} className="inline-flex max-w-[520px] items-center gap-1 text-link">
                          <span className="min-w-0 truncate">{r.command}</span>
                          <ArrowRight className="size-3.5 shrink-0" />
                        </Link>
                      ) : (
                        <span title={r.command} className="block max-w-[520px] truncate">{r.command}</span>
                      )}
                    </td>
                    <td className="px-4 font-mono text-xs text-muted-foreground">{r.type}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex h-7 items-center gap-1 px-4 text-xs text-muted-foreground">
            Read from{" "}
            {sources.map((p, i) => (
              <span key={p} className="font-mono">{i > 0 && ", "}{p}</span>
            ))}{" "}
            · edit the mapping in {settingsLink("Settings")}
          </div>
        </>
      )}
      {scripts.data.length > 0 && (
        <div className="max-w-[480px] px-4 pt-5 pb-4">
          <div className="flex h-6 items-center text-xs font-medium text-muted-foreground">Scripts in hooks/</div>
          {scripts.data.map((s) => (
            <Link key={s.path} to={scriptUrl(s.name)} className="flex h-7 items-center gap-2 rounded-sm px-1 hover:bg-accent">
              <FileCode className="size-4 text-muted-foreground" />
              <span className="flex-1 font-mono text-xs">{s.name}</span>
              <span className="text-[11px] text-muted-foreground">{language(s.name)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
