import { describe, expect, test } from "vitest";
import { buildSchema, credentialsSchema } from "@/lib/server/schemas";
import { heroesBySlug } from "@/data/heroes";
import { itemsBySlug } from "@/data/items";
import { loadoutFromSlugs } from "@/lib/slots";

describe("prototype keys are not valid slugs", () => {
  test("lookup maps do not resolve Object.prototype keys", () => {
    for (const key of ["constructor", "toString", "__proto__"]) {
      expect(heroesBySlug[key]).toBeUndefined();
      expect(itemsBySlug[key]).toBeUndefined();
    }
  });

  test("loadoutFromSlugs ignores prototype keys from the URL", () => {
    expect(() => loadoutFromSlugs(["constructor", "toString"], itemsBySlug, 0)).not.toThrow();
  });

  test("buildSchema rejects prototype hero and item names", () => {
    expect(buildSchema.safeParse({ heroSlug: "constructor", title: "abc", items: ["silencer"], flexSlots: 0 }).success).toBe(false);
    expect(buildSchema.safeParse({ heroSlug: "haze", title: "abc", items: ["toString"], flexSlots: 0 }).success).toBe(false);
  });
});

describe("buildSchema slot limits", () => {
  const fiveWeapons = ["basic-magazine", "rapid-rounds", "kinetic-dash", "long-range", "silencer"];

  test("rejects a fifth weapon item without a flex slot", () => {
    expect(buildSchema.safeParse({ heroSlug: "haze", title: "abc", items: fiveWeapons, flexSlots: 0 }).success).toBe(false);
  });

  test("accepts it when a flex slot is unlocked", () => {
    expect(buildSchema.safeParse({ heroSlug: "haze", title: "abc", items: fiveWeapons, flexSlots: 1 }).success).toBe(true);
  });
});

describe("credentialsSchema", () => {
  test("normalizes usernames to lowercase", () => {
    const parsed = credentialsSchema.parse({ username: "Admin_1", password: "12345678" });
    expect(parsed.username).toBe("admin_1");
  });
});
