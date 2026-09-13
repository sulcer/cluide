import { describe, expect, test } from "bun:test";
import { parseFrontmatter } from "@/lib/frontmatter";

describe("parseFrontmatter", () => {
  test("reads name and description", () => {
    expect(parseFrontmatter('---\nname: reviewer\ndescription: "Reviews a diff"\nmodel: opus\n---\n\nBody\n')).toEqual({
      name: "reviewer",
      description: "Reviews a diff",
    });
  });

  test("no block, no result", () => {
    expect(parseFrontmatter("# Title\n")).toBeNull();
    expect(parseFrontmatter("---\nname: x\n")).toBeNull();
  });
});
