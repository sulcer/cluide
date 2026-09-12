import { basename, join } from "node:path";
import type { PutSettingsResult, Scope, SettingsDoc, SettingsFile } from "@shared/api";
import { ApiError, requireString } from "../errors";
import { jsonText, readJsonDoc, writeText } from "../fs";
import { assertScope, claudeDir } from "../paths";
import { schemaAvailable, validateSettings } from "../schema";

const FILE_NAMES: Record<SettingsFile, string> = { settings: "settings.json", local: "settings.local.json" };

export function settingsPath(scope: Scope, file: string): string {
  const name = FILE_NAMES[file as SettingsFile];
  if (name === undefined) throw new ApiError(400, "bad_request", `unknown settings file: ${file}`);
  return scope === "global" ? join(claudeDir(), name) : join(scope, ".claude", name);
}

export function readSettings(scopeArg: string, file: string): SettingsDoc {
  const path = settingsPath(assertScope(scopeArg), file);
  const doc = readJsonDoc(path);
  const result: SettingsDoc = { ...doc, errors: doc.json === null ? [] : validateSettings(doc.json) };
  if (!schemaAvailable()) result.schema = "unavailable";
  return result;
}

export function writeSettings(body: unknown): PutSettingsResult {
  const scope = assertScope(requireString(body, "scope"));
  const path = settingsPath(scope, requireString(body, "file"));
  const { json, etag } = body as { json: unknown; etag?: string };
  if (json === null || typeof json !== "object" || Array.isArray(json)) {
    throw new ApiError(422, "unprocessable", "json must be an object");
  }
  const current = readJsonDoc(path);
  if (current.exists && current.json === null) {
    throw new ApiError(422, "unprocessable", `${basename(path)} does not parse; repair it as a file first`);
  }
  const written = writeText(path, jsonText(json), etag);
  return { ...written, errors: validateSettings(json as Record<string, unknown>) };
}
