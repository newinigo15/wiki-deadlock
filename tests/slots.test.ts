import { describe, expect, test } from "vitest";
import { addItem, addItemToFlex, EMPTY_LOADOUT, loadoutFromSlugs, removeItem, trimFlex, clampFlex, type Loadout } from "@/lib/slots";
import type { Item } from "@/data/types";

const weapon = (slug: string): Item => ({ slug, name: slug, category: "weapon", cost: 500, active: false, description: "", effects: {} });
const catalog = Object.fromEntries(["w1", "w2", "w3", "w4", "w5", "w6"].map((s) => [s, weapon(s)]));

function fill(n: number, flex = 0): Loadout {
  return loadoutFromSlugs(Object.keys(catalog).slice(0, n), catalog, flex);
}

describe("addItem", () => {
  test("places items in their category first", () => {
    const result = addItem(EMPTY_LOADOUT, catalog.w1, 0);
    expect(result.ok && result.loadout.weapon).toEqual(["w1"]);
  });

  test("does not mutate the original loadout", () => {
    const before = fill(1);
    addItem(before, catalog.w2, 0);
    expect(before.weapon).toEqual(["w1"]);
  });

  test("overflows into unlocked flex slots", () => {
    const result = addItem(fill(4, 1), catalog.w5, 1);
    expect(result.ok && result.loadout.flex).toEqual(["w5"]);
  });

  test("rejects when category and flex are full", () => {
    const result = addItem(fill(4), catalog.w5, 0);
    expect(result.ok).toBe(false);
  });

  test("rejects duplicates", () => {
    const result = addItem(fill(1), catalog.w1, 0);
    expect(result.ok).toBe(false);
  });
});

describe("loadout helpers", () => {
  test("removeItem removes from any slot group", () => {
    const loadout = fill(6, 2);
    expect(loadout.flex).toEqual(["w5", "w6"]);
    expect(removeItem(loadout, "w6").flex).toEqual(["w5"]);
  });

  test("trimFlex drops overflow when flex slots are locked again", () => {
    expect(trimFlex(fill(6, 2), 1).flex).toEqual(["w5"]);
  });

  test("loadoutFromSlugs ignores unknown slugs", () => {
    expect(loadoutFromSlugs(["nope", "w1"], catalog, 0).weapon).toEqual(["w1"]);
  });

  test("clampFlex bounds input", () => {
    expect(clampFlex(-2)).toBe(0);
    expect(clampFlex(9)).toBe(4);
    expect(clampFlex(Number.NaN)).toBe(0);
  });
});

describe("addItemToFlex", () => {
  test("places directly into flex even if the category has room", () => {
    const result = addItemToFlex(EMPTY_LOADOUT, catalog.w1, 1);
    expect(result.ok && result.loadout).toEqual({ ...EMPTY_LOADOUT, flex: ["w1"] });
  });

  test("rejects when no flex slot is unlocked", () => {
    expect(addItemToFlex(EMPTY_LOADOUT, catalog.w1, 0).ok).toBe(false);
  });
});
