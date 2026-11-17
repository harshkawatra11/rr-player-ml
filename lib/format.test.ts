import { describe, expect, it } from "vitest";
import { grp, num, ordinal, pct, sgn, surname } from "./format";

describe("format", () => {
  it("uses a true minus sign", () => {
    expect(sgn(-0.15)).toBe("−0.15");
    expect(sgn(0.2)).toBe("+0.20");
    expect(sgn(0.001)).toBe("0.00");
    expect(num(-3.2, 1)).toBe("−3.2");
  });
  it("groups digits the Indian way", () => {
    expect(grp(200999)).toBe("2,00,999");
    expect(grp(174270)).toBe("1,74,270");
    expect(grp(999)).toBe("999");
    expect(grp(1234567)).toBe("12,34,567");
  });
  it("formats shares, ordinals and surnames", () => {
    expect(pct(0.254)).toBe("25%");
    expect(ordinal(2)).toBe("2nd");
    expect(ordinal(11)).toBe("11th");
    expect(ordinal(23)).toBe("23rd");
    expect(surname("Vaibhav Sooryavanshi")).toBe("Sooryavanshi");
  });
  it("returns n/a for missing values", () => {
    expect(sgn(null)).toBe("n/a");
    expect(pct(undefined)).toBe("n/a");
  });
});
