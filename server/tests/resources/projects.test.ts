import { afterEach, beforeEach, expect, test } from "bun:test";
import { join } from "node:path";
import { listProjects } from "../../resources/projects";
import { type TempHome, tempHome } from "../temp-home";

let t: TempHome;
beforeEach(() => {
  t = tempHome();
});
afterEach(() => t.cleanup());

test("lists projects from ~/.claude.json sorted by code point, with existence and ~ for home", () => {
  const gone = join(t.home, "zzz-gone");
  t.write(".claude.json", JSON.stringify({ projects: { [t.project]: {}, [gone]: {}, [t.home]: {} } }));
  expect(listProjects()).toEqual([
    { path: t.project, name: "repo", exists: true },
    { path: gone, name: "zzz-gone", exists: false },
    { path: t.home, name: "~", exists: true },
  ]);
});
