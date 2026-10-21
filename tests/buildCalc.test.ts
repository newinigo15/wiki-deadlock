import { describe, expect, test } from "vitest";
import { computeBuildStats, stackMultiplicative } from "@/lib/buildCalc";
import type { BaseStats, Item } from "@/data/types";

const base: BaseStats = { health: 600, bulletDamage: 10, fireRate: 5, magazine: 20, moveSpeed: 7 };
const item = (slug: string, effects: Item["effects"], cost = 500): Item => ({
  slug, name: slug, category: "weapon", cost, active: false, description: "", effects,
});

describe("computeBuildStats", () => {
  test("returns base values for an empty build", () => {
    const stats = computeBuildStats(base, []);
    expect(stats.dps).toBe(50);
    expect(stats.baseDps).toBe(50);
    expect(stats.health).toBe(600);
    expect(stats.cost).toBe(0);
    expect(stats.magazine).toBe(20);
  });

  test("applies weapon damage and fire rate multiplicatively with each other", () => {
    const stats = computeBuildStats(base, [item("a", { weaponDamagePct: 0.2 }), item("b", { fireRatePct: 0.1 })]);
    expect(stats.dps).toBeCloseTo(10 * 1.2 * 5 * 1.1);
  });

  test("adds flat health before percentage health", () => {
    const stats = computeBuildStats(base, [item("a", { bonusHealth: 200 }), item("b", { healthPct: -0.15 })]);
    expect(stats.health).toBeCloseTo(800 * 0.85);
  });

  test("effective health grows with bullet resist", () => {
    const stats = computeBuildStats(base, [item("a", { bulletResist: 0.5 })]);
    expect(stats.effectiveHealthVsBullets).toBeCloseTo(1200);
  });

  test("sums cost, spirit power and ammo", () => {
    const stats = computeBuildStats(base, [
      item("a", { spiritPower: 10, ammoPct: 0.25 }, 500),
      item("b", { spiritPower: 30, ammoPct: 0.25 }, 6000),
    ]);
    expect(stats.cost).toBe(6500);
    expect(stats.spiritPower).toBe(40);
    expect(stats.magazine).toBe(30);
  });
});

describe("stackMultiplicative", () => {
  test("stacks resistances with diminishing returns", () => {
    expect(stackMultiplicative([0.3, 0.3])).toBeCloseTo(0.51);
    expect(stackMultiplicative([])).toBe(0);
  });
});
