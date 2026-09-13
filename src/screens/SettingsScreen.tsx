import type { PutSettingsResult, SchemaError, Scope, SettingsDoc, SettingsFile, WriteResult } from "@shared/api";
import { cn } from "cn";
import { CircleAlert } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { ApiError, api, q } from "@/api/client";
import { Button } from "@/components/Button";
import { Centered } from "@/components/Centered";
import { LoadFailed } from "@/components/LoadFailed";
import { ConflictDialog } from "@/editor/ConflictDialog";
import { DiffSheet } from "@/editor/DiffSheet";
import { Editor } from "@/editor/Editor";
import { SaveBar } from "@/editor/SaveBar";
import { type Loaded, type SaveFn, useDraft } from "@/hooks/useDraft";
import { useResource } from "@/hooks/useResource";
import { describeJsonError, jsonText } from "@/lib/json";
import { WarningsPanel } from "./WarningsPanel";

const NAMES: Record<SettingsFile, string> = { settings: "settings.json", local: "settings.local.json" };
const FILES: SettingsFile[] = ["settings", "local"];

export function SettingsScreen({ scope }: { scope: Scope }) {
  const [file, setFile] = useState<SettingsFile>("settings");
  const settings = useResource<SettingsDoc>(`/api/settings${q({ scope, file: "settings" })}`);
  const local = useResource<SettingsDoc>(`/api/settings${q({ scope, file: "local" })}`);
  const docs = { settings, local };
  const reloadBoth = () => {
    settings.reload();
    local.reload();
  };
  return (
    <SettingsEditor
      key={file}
      scope={scope}
      file={file}
      onFile={setFile}
      doc={docs[file].data}
      error={docs[file].error}
      onRetry={docs[file].reload}
      missing={{ settings: settings.data?.exists === false, local: local.data?.exists === false }}
      onWritten={reloadBoth}
    />
  );
}

interface EditorProps {
  scope: Scope;
  file: SettingsFile;
  onFile: (file: SettingsFile) => void;
  doc: SettingsDoc | undefined;
  error: ApiError | undefined;
  onRetry: () => void;
  missing: Record<SettingsFile, boolean>;
  onWritten: () => void;
}

function SettingsEditor({ scope, file, onFile, doc, error, onRetry, missing, onWritten }: EditorProps) {
  const [errors, setErrors] = useState<SchemaError[]>();
  const [created, setCreated] = useState<Loaded>();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const raw = doc?.raw !== undefined;
  const loaded = useMemo<Loaded | undefined>(() => {
    if (created) return created;
    if (doc === undefined || !doc.exists) return undefined;
    return { content: doc.raw ?? jsonText(doc.json), etag: doc.etag };
  }, [created, doc]);

  const save: SaveFn = async (content, etag) => {
    if (raw && doc) {
      const result = await api.put<WriteResult>("/api/file", { path: doc.path, content, etag });
      onWritten(); // the file may parse now, and the warnings need a fresh read
      return result;
    }
    let json: unknown;
    try {
      json = JSON.parse(content);
    } catch (e) {
      throw new ApiError(422, "unprocessable", (e as Error).message);
    }
    const result = await api.put<PutSettingsResult>("/api/settings", { scope, file, json, etag });
    setErrors(result.errors);
    if (created) onWritten(); // the tab loses its "missing" label
    return result;
  };
  const draft = useDraft(loaded, save, NAMES[file]);
  const shownErrors = raw ? [] : (errors ?? doc?.errors ?? []);

  const jump = (pointer: string) => {
    const key = pointer.split("/").filter(Boolean).at(-1);
    const ta = textarea.current;
    if (!key || !ta) return;
    const i = ta.value.indexOf(`"${key}"`);
    if (i < 0) return;
    ta.focus();
    ta.setSelectionRange(i, i + key.length + 2);
    const line = ta.value.slice(0, i).split("\n").length;
    ta.scrollTop = Math.max(0, (line - 1) * 20 - ta.clientHeight / 2);
  };

  const tabs = (
    <div className="flex h-10 shrink-0 items-center gap-4 border-b px-4">
      {FILES.map((f) => (
        <button
          key={f}
          type="button"
          onClick={() => onFile(f)}
          className={cn(
            "relative flex h-10 items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground",
            f === file &&
              "text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-foreground",
          )}
        >
          {NAMES[f]}
          {missing[f] && <span className="font-sans text-[11px] text-muted-foreground">missing</span>}
        </button>
      ))}
      <div className="flex-1" />
      {draft.ready && (
        <SaveBar dirty={draft.dirty} saving={draft.saving} onSave={draft.save} onDiscard={draft.discard} />
      )}
    </div>
  );

  if (doc === undefined) {
    if (error !== undefined && error.code !== "offline") {
      return (
        <>
          {tabs}
          <LoadFailed what="Settings" error={error} onRetry={onRetry} />
        </>
      );
    }
    return tabs;
  }
  if (!doc.exists && created === undefined) {
    return (
      <>
        {tabs}
        <Centered title={`${NAMES[file]} does not exist in this scope`} path={doc.path}>
          <Button variant="primary" onClick={() => setCreated({ content: "", etag: null, draft: "{\n  \n}\n" })}>
            Create {NAMES[file]}
          </Button>
        </Centered>
      </>
    );
  }
  if (!draft.ready) return tabs;

  return (
    <>
      {tabs}
      <div className="flex min-h-0 flex-1 flex-col min-[1200px]:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex h-8 shrink-0 items-center border-b px-4 font-mono text-xs text-muted-foreground">
            {doc.path}
          </div>
          {raw && (
            <div className="mx-4 mt-3 flex items-center gap-2 rounded-md border border-destructive px-2.5 py-1.5 text-xs text-destructive">
              <CircleAlert className="size-4 shrink-0" />
              <span className="font-mono">{NAMES[file]}</span>
              <span>does not parse. Fix it and save.</span>
              <div className="flex-1" />
              <span className="font-mono opacity-80">{describeJsonError(draft.content)}</span>
            </div>
          )}
          <Editor ref={textarea} value={draft.content} onChange={draft.setContent} error={draft.error} />
        </div>
        <WarningsPanel errors={shownErrors} unavailable={doc.schema === "unavailable"} onJump={jump} />
      </div>
      <DiffSheet
        open={draft.diffOpen}
        onOpenChange={draft.setDiffOpen}
        name={NAMES[file]}
        path={doc.path}
        diff={draft.diff}
      />
      <ConflictDialog
        conflict={draft.conflict}
        name={NAMES[file]}
        path={doc.path}
        onReload={draft.reload}
        onOverwrite={draft.overwrite}
        onDismiss={draft.dismissConflict}
      />
    </>
  );
}
