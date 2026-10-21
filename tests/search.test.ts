import { describe, expect, test } from "vitest";
import { normalize, search } from "@/lib/search";

describe("search", () => {
  test("finds a hero by name ignoring case and accents", () => {
    expect(search("HAZE")[0]?.href).toBe("/heroes/haze");
  });

  test("finds guides with accented queries", () => {
    expect(search("parry").some((r) => r.href === "/guias/como-hacer-parry")).toBe(true);
    expect(search("guardián").length).toBeGreaterThan(0);
  });

  test("returns nothing for empty or one-letter queries", () => {
    expect(search("")).toEqual([]);
    expect(search("a")).toEqual([]);
  });

  test("ranks title matches above description matches", () => {
    expect(search("toxic")[0]?.title).toBe("Toxic Bullets");
  });

  test("normalize strips diacritics", () => {
    expect(normalize("Vitalidad Espíritu")).toBe("vitalidad espiritu");
  });
});
