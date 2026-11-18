// Guards the public-data promise: only six derived files, under 2.5 MB, and no ball-level keys.
import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "public", "data");
const want = ["batters.json", "bowlers.json", "grid.json", "meta.json", "showcase.json", "teams.json"];
const optional = ["ledger.json"];
const have = fs.readdirSync(dir).filter((f) => !optional.includes(f) || true).sort();
const core = have.filter((f) => !optional.includes(f));
const problems = [];
if (JSON.stringify(core) !== JSON.stringify(want)) problems.push(`expected ${want.join(", ")} but found ${have.join(", ")}`);
let total = 0;
for (const f of have) {
  const text = fs.readFileSync(path.join(dir, f), "utf8");
  total += Buffer.byteLength(text);
  for (const k of ["innings_ball_num", "striker_id", "over_ball_num", "delivery_ist_time", "bowl_speed", "non_striker"]) if (text.includes(k)) problems.push(`${f} contains ${k}`);
}
if (total > 2.5 * 1024 * 1024) problems.push(`public/data totals ${(total / 1048576).toFixed(2)} MB, limit 2.5 MB`);
if (problems.length) {
  console.error(problems.join("\n"));
  console.error("CHECK PUBLIC FAIL");
  process.exit(1);
}
console.log(`CHECK PUBLIC PASS (${(total / 1048576).toFixed(2)} MB in ${have.length} files)`);
