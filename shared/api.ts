// Mirrors docs/spec/api; when the two disagree, the spec wins.

export type Scope = "global" | string;

export type ErrorCode =
  | "bad_request"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "unprocessable"
  | "internal";

export interface ApiErrorBody {
  error: { code: ErrorCode; message: string; current?: unknown };
}

export interface WriteResult {
  etag: string;
  diff: string;
}

export interface Project {
  path: string;
  name: string;
  exists: boolean;
}

export type FileKind =
  | "memory"
  | "rules"
  | "agents"
  | "skills"
  | "commands"
  | "hooks"
  | "keybindings";

export interface FileEntry {
  name: string;
  path: string;
  exists: boolean;
}

export interface FileDoc {
  path: string;
  content: string;
  etag: string;
}

export interface PutFileBody {
  path: string;
  content: string;
  etag?: string;
}

export interface PostFileBody {
  path: string;
  content: string;
}

export type SettingsFile = "settings" | "local";

export interface SchemaError {
  path: string;
  message: string;
}

export interface SettingsDoc {
  path: string;
  exists: boolean;
  json: Record<string, unknown> | null;
  raw?: string;
  etag: string | null;
  errors: SchemaError[];
  schema?: "unavailable";
}

export interface PutSettingsBody {
  scope: Scope;
  file: SettingsFile;
  json: Record<string, unknown>;
  etag?: string;
}

export interface PutSettingsResult extends WriteResult {
  errors: SchemaError[];
}

export type McpScope = "local" | "project" | "user" | "plugin" | "managed";
export type McpTarget = "local" | "project" | "user";

export type McpConfig =
  | { type?: "stdio"; command: string; args?: string[]; env?: Record<string, string>; [key: string]: unknown }
  | { type: "http" | "sse"; url: string; headers?: Record<string, string>; [key: string]: unknown };

export interface McpEntry {
  name: string;
  scope: McpScope;
  file: string;
  config: McpConfig;
  effective: boolean;
  shadowedBy: McpScope | null;
  enabled: boolean | null;
  etag: string | null;
}

export interface PutMcpBody {
  scope: Scope;
  target: McpTarget;
  name: string;
  config: McpConfig;
  etag?: string;
}

export interface McpApprovalBody {
  scope: string;
  name: string;
  enabled: boolean;
}

export interface Plugin {
  id: string;
  name: string;
  marketplace: string;
  marketplaceSource: string | null;
  version: string;
  installPath: string;
  enabled: boolean;
  hasMcp: boolean;
  hasHooks: boolean;
  etag: string;
}

export interface PutPluginBody {
  id: string;
  enabled: boolean;
  etag?: string;
}
