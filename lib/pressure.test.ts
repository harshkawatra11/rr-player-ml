import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { pctl, situation } from "./pressure";
import type { Grid } from "./types";

const g: Grid = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public", "data", "grid.json"), "utf8"));

describe("pctl", () => {
  const q = Array.from({ length: 201 }, (_, i) => i);
  it("is 0 below the first quantile and 1 above the last", () => {
    expect(pctl(q, -5)).toBe(0);
    expect(pctl(q, 500)).toBe(1);
  });
  it("interpolates inside the range", () => {
    expect(pctl(q, 100)).toBeCloseTo(0.5, 6);
    expect(pctl(q, 50.5)).toBeCloseTo(0.2525, 4);
  });
});

describe("grid", () => {
  it("win probability falls as runs needed rises, at every wickets-in-hand row", () => {
    for (const w of ["2", "5", "8"]) {
      const balls = 30;
      let prev = 1000;
      for (let need = 1; need <= 100; need++) {
        const v = g.wp[w][need - 1][balls - 1];
        expect(v).toBeLessThanOrEqual(prev + 25); // win probability times 1000, small wobble allowed
        prev = v;
      }
      expect(g.wp[w][99][balls - 1]).toBeLessThan(g.wp[w][4][balls - 1]);
    }
  });
});

describe("situation", () => {
  it("scores a tight final-over chase as High or Extreme", () => {
    const s = situation(g, 12, 6, 5, false);
    expect(["High", "Extreme"]).toContain(s.band);
    expect(s.pi).not.toBeNull();
  });
  it("calls a lost chase Decided", () => {
    expect(situation(g, 90, 12, 3, false).band).toBe("Decided");
  });
  it("calls a comfortable chase with 80 needed off 60 balls Routine", () => {
    const s = situation(g, 80, 60, 9, false);
    expect(s.band).toBe("Routine");
    expect(s.pi as number).toBeLessThan(50);
  });
  it("covers the last ten overs only: balls left above 60 clamp to 60", () => {
    expect(situation(g, 80, 108, 9, false).wp).toBeCloseTo(situation(g, 80, 60, 9, false).wp, 6);
  });
  it("a knockout never lowers the index", () => {
    const a = situation(g, 30, 24, 6, false).pi as number;
    const b = situation(g, 30, 24, 6, true).pi as number;
    expect(b).toBeGreaterThanOrEqual(a);
  });
});

