import { describe, expect, it } from "vitest";
import { generateCity, groupByType } from "@/lib/cityGen";

describe("generateCity", () => {
  it("es determinista con la misma semilla", () => {
    expect(generateCity({ seed: 7 })).toEqual(generateCity({ seed: 7 }));
  });
  it("cambia con otra semilla", () => {
    expect(generateCity({ seed: 7 })).not.toEqual(generateCity({ seed: 8 }));
  });
  it("la densidad reduce el número de edificios", () => {
    expect(generateCity({ density: 0.3 }).length).toBeLessThan(generateCity({ density: 1 }).length);
  });
  it("agrupa en tipos fijos", () => {
    const g = groupByType(generateCity());
    expect(Object.keys(g)).toHaveLength(3);
  });
});
