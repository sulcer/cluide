import type { WriteResult } from "@shared/api";
import { useEffect, useState } from "react";
import type { ApiError } from "@/api/client";
import { useWindowEvent } from "@/lib/events";
import { toast } from "@/lib/toast";

export interface Loaded { content: string; etag: string | null; draft?: string }
export interface Conflict { content: string; etag: string }
export interface DraftError { status: number; message: string }
export type SaveFn = (content: string, etag: string | undefined) => Promise<WriteResult | { etag: string }>;

interface Options {
  // Maps a 409 body's `current` to what Reload should load. Default: the body already is { content, etag }.
  conflictOf?: (current: unknown) => Conflict;
  // Description of the "Saved" toast, e.g. the server name in the MCP sheet.
  savedDescription?: string;
}

const asConflict = (current: unknown): Conflict => current as Conflict;

export function useDraft(loaded: Loaded | undefined, save: SaveFn, name: string, options: Options = {}) {
  const [base, setBase] = useState<Loaded>();
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<DraftError>();
  const [conflict, setConflict] = useState<Conflict>();
  const [diff, setDiff] = useState("");
  const [diffOpen, setDiffOpen] = useState(false);

  useEffect(() => {
    if (loaded === undefined) return;
    setBase({ content: loaded.content, etag: loaded.etag });
    setContent(loaded.draft ?? loaded.content);
    setError(undefined);
    setConflict(undefined);
  }, [loaded?.content, loaded?.etag, loaded?.draft]);

  const dirty = base !== undefined && content !== base.content;

  const commit = async (etag: string | undefined) => {
    const snapshot = content;
    setSaving(true);
    setError(undefined);
    try {
      const result = await save(snapshot, etag);
      setBase({ content: snapshot, etag: result.etag });
      if ("diff" in result) {
        setDiff(result.diff);
        toast({ title: "Saved", description: options.savedDescription, action: { label: "View diff", run: () => setDiffOpen(true) } });
      }
    } catch (e) {
      const err = e as ApiError;
      // A 409 without `current` (or a mapped conflict missing its etag) carries nothing Reload
      // could load, so it isn't a usable conflict: fall through to the generic failure toast.
      const mapped = err.status === 409 && err.current !== undefined ? (options.conflictOf ?? asConflict)(err.current) : undefined;
      if (mapped?.etag !== undefined) {
        setConflict(mapped);
      } else {
        if (err.status === 400 || err.status === 422) setError({ status: err.status, message: err.message });
        toast({ title: "Save failed", description: err.status ? `${err.status} · ${err.message}` : err.message, error: true });
      }
    } finally {
      setSaving(false);
    }
  };

  const doSave = () => {
    if (dirty && !saving) void commit(base?.etag ?? undefined);
  };
  const discard = () => {
    if (base !== undefined) {
      setContent(base.content);
      setError(undefined);
    }
  };
  const reload = () => {
    if (conflict === undefined) return;
    setBase(conflict);
    setContent(conflict.content);
    setConflict(undefined);
    toast({ title: `Reloaded ${name} from disk` });
  };
  const overwrite = () => {
    setConflict(undefined);
    void commit(undefined);
  };

  useWindowEvent("cluide:save", doSave);
  useWindowEvent("cluide:escape", discard);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return {
    content, setContent, dirty, saving, error, conflict, diff, diffOpen, setDiffOpen,
    etag: base?.etag ?? null,
    ready: base !== undefined,
    save: doSave, discard, reload, overwrite,
    dismissConflict: () => setConflict(undefined),
  };
}
