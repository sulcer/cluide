import type { FileDoc, FileEntry, FileKind, Scope, WriteResult } from "@shared/api";
import { CircleAlert, FileText, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router";
import { type ApiError, api, q } from "@/api/client";
import { useResource } from "@/api/useResource";
import { Button } from "@/components/Button";
import { Centered } from "@/components/Centered";
import { IconButton } from "@/components/IconButton";
import { Editor } from "@/editor/Editor";
import { SaveBar } from "@/editor/SaveBar";
import { type Loaded, type SaveFn, useDraft } from "@/editor/useDraft";
import { useWindowEvent } from "@/lib/events";
import { parseFrontmatter } from "@/lib/frontmatter";
import { pushRecent } from "@/lib/recent";
import { HOOK_SCRIPT_PRIMARY, kindDir, screenDef, screenUrl, scopeName, scopeUrl } from "@/lib/routes";
import { toast } from "@/lib/toast";
import type { ShellContext } from "@/shell/Shell";
import { FileList } from "./FileList";

interface Props { scope: Scope; kind: FileKind; file?: string }

const FIXED: FileKind[] = ["memory", "keybindings"];

export function FilesScreen({ scope, kind, file }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { claudeDir } = useOutletContext<ShellContext>();
  const list = useResource<FileEntry[]>(`/api/files${q({ scope, kind })}`);
  const [selectedPath, setSelectedPath] = useState<string | undefined>((location.state as { path?: string } | null)?.path);
  // Reopening a different recent file of the same kind navigates within the same route pattern, so
  // FilesScreen doesn't remount; re-apply location.state's path on every navigation, not just the first.
  useEffect(() => {
    const p = (location.state as { path?: string } | null)?.path;
    if (p !== undefined) setSelectedPath(p);
  }, [location.key]);
  const [creating, setCreating] = useState(false);
  // A click, a create, or opening a file directly all focus the editor; j/k browsing must not,
  // or the next j/k types into the now-focused textarea instead of moving the selection.
  const [focusEditor, setFocusEditor] = useState(true);
  const entries = list.data;
  const selected =
    entries?.find((e) => e.path === selectedPath) ??
    (file !== undefined ? entries?.find((e) => e.name === file) : entries?.[0]);
  const dir = kindDir(scope, kind, claudeDir);
  const canCreate = !FIXED.includes(kind);
  const primary = kind === "hooks" ? HOOK_SCRIPT_PRIMARY : screenDef(kind)?.primary;
  const urlOf = (entry: FileEntry) =>
    kind === "hooks" ? `${scopeUrl(scope)}/hooks/${encodeURIComponent(entry.name)}` : screenUrl(scope, kind);

  const select = useCallback(
    (entry: FileEntry, focus = true) => {
      setFocusEditor(focus);
      if (kind === "hooks") navigate(`${scopeUrl(scope)}/hooks/${encodeURIComponent(entry.name)}`);
      else setSelectedPath(entry.path);
    },
    [kind, scope, navigate],
  );

  useEffect(() => {
    if (selected) pushRecent({ label: selected.name, path: selected.path, url: urlOf(selected) });
  }, [selected?.path]);

  useWindowEvent("cluide:primary", () => {
    if (canCreate) setCreating(true);
  });

  const create = async (name: string) => {
    const path = `${dir}/${name}`;
    try {
      await api.post("/api/file", { path, content: "" });
    } catch (e) {
      const err = e as ApiError;
      toast({ title: "Save failed", description: err.status ? `${err.status} · ${err.message}` : err.message, error: true });
      return;
    }
    toast({ title: `Created ${name}`, description: path });
    setCreating(false);
    list.reload();
    setFocusEditor(true);
    if (kind === "hooks") navigate(`${scopeUrl(scope)}/hooks/${encodeURIComponent(name)}`);
    else setSelectedPath(path);
  };

  const afterDelete = () => {
    const i = entries?.findIndex((e) => e.path === selected?.path) ?? -1;
    const next = entries?.[i + 1] ?? entries?.[i - 1];
    if (kind === "hooks") navigate(next ? `${scopeUrl(scope)}/hooks/${encodeURIComponent(next.name)}` : screenUrl(scope, "hooks"));
    else setSelectedPath(next?.path);
    list.reload();
  };

  return (
    <div className="flex min-h-0 flex-1">
      <FileList kind={kind} entries={entries} selected={selected} onSelect={select} creating={creating} onCreate={create} onCancelCreate={() => setCreating(false)} />
      {entries !== undefined && entries.length === 0 ? (
        <Centered title={`No ${kind} in this scope`} path={dir}>
          {canCreate && (
            <Button onClick={() => setCreating(true)}>
              <Plus />
              {primary}
            </Button>
          )}
        </Centered>
      ) : selected ? (
        <FileEditor key={selected.path} scope={scope} kind={kind} entry={selected} autoFocus={focusEditor} onCreated={list.reload} onDeleted={afterDelete} />
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}

interface EditorProps { scope: Scope; kind: FileKind; entry: FileEntry; autoFocus: boolean; onCreated: () => void; onDeleted: () => void }

function FileEditor({ scope, kind, entry, autoFocus, onCreated, onDeleted }: EditorProps) {
  const doc = useResource<FileDoc>(entry.exists ? `/api/file${q({ path: entry.path })}` : null);
  const [created, setCreated] = useState<Loaded>();
  const isNew = useRef(!entry.exists);
  const loaded = useMemo<Loaded | undefined>(
    () => created ?? (doc.data ? { content: doc.data.content, etag: doc.data.etag } : undefined),
    [created, doc.data],
  );

  const save: SaveFn = async (content, etag) => {
    if (isNew.current) {
      const result = await api.post<{ etag: string }>("/api/file", { path: entry.path, content });
      isNew.current = false;
      toast({ title: `Created ${entry.name}`, description: entry.path });
      onCreated();
      return result;
    }
    return api.put<WriteResult>("/api/file", { path: entry.path, content, etag });
  };
  const draft = useDraft(loaded, save, entry.name);
  const [deleting, setDeleting] = useState(false);
  const frontmatter = kind === "agents" || kind === "skills" ? parseFrontmatter(draft.content) : null;

  const remove = async () => {
    await api.del(`/api/file${q({ path: entry.path, etag: draft.etag ?? undefined })}`);
    toast({ title: `Deleted ${entry.name}`, description: "backup in ~/.cluide/backups" });
    onDeleted();
  };

  if (!entry.exists && created === undefined) {
    return (
      <Centered icon={FileText} title={`${entry.name} does not exist in this scope`} path={entry.path}>
        <Button variant="primary" onClick={() => setCreated({ content: "", etag: null, draft: `# ${scopeName(scope)}\n\n` })}>
          Create {entry.name}
        </Button>
      </Centered>
    );
  }
  if (doc.error) {
    return (
      <Centered
        icon={CircleAlert}
        title={`${entry.name} could not be read`}
        path={doc.error.status ? `${doc.error.status} · ${doc.error.message}` : doc.error.message}
      />
    );
  }
  if (!draft.ready) return <div className="flex-1" />;

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex h-10 shrink-0 items-center gap-3 border-b px-4">
        <span className="shrink-0 font-medium">{entry.name}</span>
        <span className="truncate font-mono text-xs text-muted-foreground">{entry.path}</span>
        <div className="flex-1" />
        <SaveBar dirty={draft.dirty} saving={draft.saving} onSave={draft.save} onDiscard={draft.discard} />
        {!FIXED.includes(kind) && (
          <IconButton label="Delete" onClick={() => setDeleting(true)}>
            <Trash2 />
          </IconButton>
        )}
      </div>
      {frontmatter && (
        <div className="flex h-8 shrink-0 items-center gap-3 border-b px-4 text-xs">
          <span className="font-mono">{frontmatter.name}</span>
          <span className="truncate text-muted-foreground">{frontmatter.description}</span>
          <div className="flex-1" />
          <span className="rounded-sm border px-1.5 text-[11px] leading-4">frontmatter</span>
        </div>
      )}
      <Editor value={draft.content} onChange={draft.setContent} error={draft.error} autoFocus={autoFocus} />
      {/* Task 5 adds: <DiffSheet />, <ConflictDialog />, <DeleteDialog open={deleting} ... onConfirm={remove} /> */}
    </div>
  );
}
