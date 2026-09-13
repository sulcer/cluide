import type { McpTarget, Scope } from "@shared/api";
import { cn } from "cn";
import { useState } from "react";
import { type ApiError, api } from "@/api/client";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Kbd } from "@/components/Kbd";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { isMod, MOD } from "@/lib/keys";
import { buildConfig, type Transport } from "@/lib/mcp";
import { toast } from "@/lib/toast";

const FILES: Record<McpTarget, string> = { user: "~/.claude.json", project: ".mcp.json", local: "this project only" };
const HINTS: Record<McpTarget, string> = {
  user: "Available in every project.",
  project: "Committed with the repo. Teammates approve it on first run.",
  local: "Only you, only here.",
};
const WRITES: Record<McpTarget, string> = { user: "~/.claude.json", project: ".mcp.json", local: "~/.claude.json" };
const TARGETS: Array<{ id: McpTarget; label: string }> = [
  { id: "user", label: "User" },
  { id: "project", label: "Project" },
  { id: "local", label: "Local" },
];
const TRANSPORTS: Transport[] = ["stdio", "http", "sse"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: Scope;
  onAdded: () => void;
}

export function McpAddDialog({ open, onOpenChange, scope, onAdded }: Props) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState<McpTarget>(scope === "global" ? "user" : "project");
  const [transport, setTransport] = useState<Transport>("stdio");
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState("");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState("");
  const [busy, setBusy] = useState(false);
  const ready = name.trim() !== "" && (transport === "stdio" ? command.trim() !== "" : url.trim() !== "");

  const reset = () => {
    setName("");
    setCommand("");
    setArgs("");
    setUrl("");
    setHeaders("");
    setTransport("stdio");
    setTarget(scope === "global" ? "user" : "project");
  };

  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true);
    try {
      await api.put("/api/mcp", {
        scope,
        target,
        name: name.trim(),
        config: buildConfig({ transport, command, args, url, headers }),
      });
      toast({ title: `Added ${name.trim()}`, description: WRITES[target] });
      onOpenChange(false);
      reset();
      onAdded();
    } catch (e) {
      const err = e as ApiError;
      toast({
        title: "Save failed",
        description: err.status ? `${err.status} · ${err.message}` : err.message,
        error: true,
      });
    } finally {
      setBusy(false);
    }
  };

  const field =
    "h-8 rounded-md border border-input bg-transparent px-2.5 font-mono text-xs placeholder:text-muted-foreground";
  const area =
    "rounded-md border border-input bg-transparent px-2.5 py-1.5 font-mono text-xs placeholder:text-muted-foreground";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[480px] sm:max-w-[480px] gap-0 rounded-lg p-0"
        onKeyDown={(e) => {
          if (isMod(e) && e.key === "Enter") void submit();
        }}
      >
        <div className="border-b px-4 pt-4 pb-3">
          <DialogTitle className="text-sm font-semibold">Add server</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">Writes to {WRITES[target]}</DialogDescription>
        </div>
        <div className="flex flex-col gap-3.5 p-4">
          <Field label="Name">
            <Input
              size="md"
              autoFocus
              className="font-mono"
              placeholder="my-server"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          {scope !== "global" && (
            <Field label="Target" plain>
              <div className="grid grid-cols-3 gap-0.5 rounded-md bg-muted p-0.5">
                {TARGETS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTarget(t.id)}
                    className={cn(
                      "flex h-10 flex-col items-center justify-center rounded-sm",
                      target === t.id && "bg-background shadow-[0_1px_2px_rgba(0,0,0,.2)]",
                    )}
                  >
                    <span className="text-xs font-medium">{t.label}</span>
                    <span className="font-mono text-[10px] leading-3.5 text-muted-foreground">{FILES[t.id]}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">{HINTS[target]}</p>
            </Field>
          )}
          <Field label="Transport" plain>
            <div className="grid w-60 grid-cols-3 gap-0.5 rounded-md bg-muted p-0.5">
              {TRANSPORTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTransport(t)}
                  className={cn(
                    "h-[26px] rounded-sm font-mono text-xs",
                    transport === t && "bg-background shadow-[0_1px_2px_rgba(0,0,0,.2)]",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>
          {transport === "stdio" ? (
            <>
              <Field label="Command">
                <input
                  className={field}
                  placeholder="npx"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                />
              </Field>
              <Field label="Args" hint="one per line">
                <textarea rows={3} className={area} value={args} onChange={(e) => setArgs(e.target.value)} />
              </Field>
            </>
          ) : (
            <>
              <Field label="URL">
                <input
                  className={field}
                  placeholder="https://mcp.example.com/mcp"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </Field>
              <Field label="Headers" hint="Name: value, one per line">
                <textarea rows={3} className={area} value={headers} onChange={(e) => setHeaders(e.target.value)} />
              </Field>
            </>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
          <Button size="md" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="md"
            variant="primary"
            disabled={!ready || busy}
            className="disabled:opacity-50"
            onClick={() => void submit()}
          >
            Add server <Kbd onPrimary>{MOD}↵</Kbd>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// `plain`: a <label> would forward a caption click to the first segmented button and press it.
function Field({
  label,
  hint,
  children,
  plain,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  plain?: boolean;
}) {
  const Caption = plain ? "div" : "label";
  return (
    <Caption className="flex flex-col gap-1.5">
      <span className="text-xs font-medium">
        {label}
        {hint && <span className="ml-1.5 font-normal text-muted-foreground">{hint}</span>}
      </span>
      {children}
    </Caption>
  );
}
