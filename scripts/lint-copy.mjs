// Fails on dashes, exclamation marks in JSX text, or banned words in anything a reader sees.
// Scans lib/copy.ts, app/**/*.tsx and components/**/*.tsx: string literals that contain a space, and JSX text.
import fs from "node:fs";
import path from "node:path";

const BAN = [
  "here's", "let's", "bottom line", "delve", "game-changer", "game changer", "unlock", "it's not just", "make no mistake", "landscape", "robust", "seamless", "holistic", "tapestry", "paradigm", "navigate",
  "revolutioni", "cutting-edge", "leverage", "empower", "transformative", "journey", "synergy", "world-class", "best-in-class", "next-gen", "reimagine", "supercharge", "harness", "crucial", "pivotal",
  "furthermore", "moreover", "in today's", "ever-evolving", "imagine", "testament", "elevate", "what if", "picture this", "dive into", "deep dive", "groundbreaking", "state-of-the-art", "plethora",
  "myriad", "underscore", "showcase", "foster", "bolster", "spearhead", "nuanced", "intricate", "meticulous", "realm", "fast-paced", "in conclusion", "it is important to note", "vibrant", "valuable insights", "clutch gene",
];
const root = process.cwd();
const files = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx|ts)$/.test(e.name) && !/\.test\.ts$/.test(e.name)) files.push(p);
  }
}
for (const d of ["app", "components"]) if (fs.existsSync(path.join(root, d))) walk(path.join(root, d));
files.push(path.join(root, "lib", "copy.ts"));

const problems = [];
for (const f of files) {
  const rel = path.relative(root, f);
  const src = fs.readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/^import .*$/gm, "");
  const texts = [];
  for (const m of src.matchAll(/"([^"\n]*)"|'([^'\n]*)'|`([^`]*)`/g)) {
    const t = m[1] ?? m[2] ?? m[3] ?? "";
    if (/\s/.test(t.trim())) texts.push({ kind: "string", t });
  }
  for (const m of src.matchAll(/>([^<>{}]+)</g)) {
    const t = m[1].trim();
    if (t) texts.push({ kind: "jsx", t });
  }
  for (const { kind, t } of texts) {
    if (/[—–]/.test(t)) problems.push(`${rel}: dash in ${kind}: ${t.slice(0, 80)}`);
    if (kind === "jsx" && /!/.test(t)) problems.push(`${rel}: exclamation mark in JSX text: ${t.slice(0, 80)}`);
    const low = t.toLowerCase();
    for (const w of BAN) if (low.includes(w)) problems.push(`${rel}: banned word "${w}" in ${kind}: ${t.slice(0, 80)}`);
  }
}
if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`LINT COPY FAIL (${problems.length})`);
  process.exit(1);
}
console.log(`LINT COPY PASS (${files.length} files)`);
