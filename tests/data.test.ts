import { describe, expect, test } from "vitest";
import { heroes } from "@/data/heroes";
import { items, itemsBySlug } from "@/data/items";
import { guides } from "@/data/guides";

describe("content integrity", () => {
  test("every hero core item exists in the item catalog", () => {
    const missing = heroes.flatMap((h) => h.coreItems.filter((s) => !itemsBySlug[s]).map((s) => `${h.slug}:${s}`));
    expect(missing).toEqual([]);
  });

  test("slugs are unique and URL-friendly", () => {
    for (const list of [heroes, items, guides]) {
      const slugs = list.map((x) => x.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
      slugs.forEach((s) => expect(s).toMatch(/^[a-z0-9-]+$/));
    }
  });

  test("skill paths are permutations of the four abilities", () => {
    heroes.forEach((h) => expect([...h.skillPath].sort()).toEqual([1, 2, 3, 4]));
  });
});
