/** Colour scales for heat cells. Sequential runs white to pink to deep pink; diverging runs blue to white to pink. */
export const COLORS = {
  pink: "#E50695",
  pinkDeep: "#8A0458",
  pinkTint: "#FCE1F1",
  navy: "#021D45",
  blue: "#1226AA",
  series: "#3553E0",
  blueTint: "#DDE3FA",
  grey: "#8A93A6",
  line: "#D5D9E6",
  panel: "#F5F6FA",
  good: "#1E8A4C",
  bad: "#D7263D",
  ink: "#0A0F1F",
};

type RGB = [number, number, number];
const hexToRgb = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
const rgbToHex = (c: RGB) => "#" + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
const mix = (a: string, b: string, t: number): string => {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return rgbToHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
};

/** t from 0 to 1. */
export function seq(t: number): string {
  const v = Math.max(0, Math.min(1, t));
  if (v < 0.5) return mix("#FFFFFF", "#F7A8D5", v / 0.5);
  if (v < 0.8) return mix("#F7A8D5", "#E50695", (v - 0.5) / 0.3);
  return mix("#E50695", "#8A0458", (v - 0.8) / 0.2);
}

/** t from negative one to positive one: blue below zero, pink above. */
export function div(t: number): string {
  const v = Math.max(-1, Math.min(1, t));
  return v < 0 ? mix("#FFFFFF", "#3553E0", -v) : mix("#FFFFFF", "#E50695", v);
}

function lum(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Readable text colour on a fill. */
export function inkOn(fill: string): string {
  return lum(fill) < 0.3 ? "#FFFFFF" : COLORS.ink;
}
