import Ajv, { type ValidateFunction } from "ajv";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { SchemaError } from "@shared/api";
import { cluideDir } from "./paths";

const SCHEMA_URL = "https://www.schemastore.org/claude-code-settings.json";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

let validator: ValidateFunction | null = null;
let schema: Record<string, any> | null = null;
let knownKeys = new Set<string>();

const cachePath = (): string => join(cluideDir(), "schema-cache.json");

export async function loadSchema(): Promise<boolean> {
  const cache = cachePath();
  let text: string | null = null;
  const fresh = existsSync(cache) && Date.now() - statSync(cache).mtimeMs < MAX_AGE_MS;
  if (fresh) {
    text = readFileSync(cache, "utf8");
  } else {
    try {
      const res = await fetch(SCHEMA_URL);
      if (res.ok) {
        text = await res.text();
        mkdirSync(dirname(cache), { recursive: true });
        writeFileSync(cache, text);
      }
    } catch {
      // offline; fall through to a stale cache if there is one
    }
    if (text === null && existsSync(cache)) text = readFileSync(cache, "utf8");
  }
  if (text === null) {
    validator = null;
    schema = null;
    knownKeys = new Set();
    return false;
  }
  schema = JSON.parse(text);
  // strict: false tolerates SchemaStore's extra keywords; formats would need a second dependency.
  validator = new Ajv({ allErrors: true, strict: false, validateFormats: false }).compile(schema!);
  knownKeys = new Set(Object.keys(schema!.properties ?? {}));
  return true;
}

export const schemaAvailable = (): boolean => validator !== null;
export const schemaJson = (): unknown | null => schema;

export function validateSettings(json: Record<string, unknown>): SchemaError[] {
  if (validator === null) return [];
  validator(json);
  const errors: SchemaError[] = (validator.errors ?? []).map((e) => ({
    path: e.instancePath,
    message: e.message ?? "invalid",
  }));
  for (const key of Object.keys(json)) {
    if (!knownKeys.has(key)) errors.push({ path: `/${key}`, message: "not a documented setting" });
  }
  return errors;
}
