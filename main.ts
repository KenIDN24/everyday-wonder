import * as fs from "node:fs";
import * as path from "node:path";

const LINE =
  "At 3 a.m. with the fridge door open, I realize I'm the warmest thing this butter has met since it was cream.";

const outDir = process.env.OUTPUT_DIR ?? "/output";
const entry = LINE;

if (entry.length < 1 || entry.length > 200) {
  throw new Error(`entry length ${entry.length} outside gate 1-200`);
}
if (entry.trim() !== entry) throw new Error("entry has leading/trailing whitespace");
if (entry.includes("\n") || entry.includes("\r") || entry.includes("\t")) {
  throw new Error("entry must be a single line");
}
if (/\s{2,}/.test(entry)) throw new Error("entry has a double space");
if (/[^\x20-\x7E]/.test(entry)) throw new Error("entry has non-ASCII characters");

// One sentence: strip time abbreviations ("3 a.m.") before counting
// sentence-ending periods, so "a.m." is never mistaken for a second sentence.
const stripped = entry.replace(/\b\d{1,2}\s?[ap]\.m\./gi, "");
const terminators = (stripped.match(/[.!?]/g) ?? []).length;
if (terminators !== 1) {
  throw new Error(`entry must be exactly one sentence, found ${terminators} terminators`);
}
// The single terminator must be the final character, and no other period
// may survive the abbreviation strip: a mid-sentence "e.g." or "Mr."
// would break the one-sentence reading the judge expects.
if (!entry.endsWith(".")) throw new Error("entry must end with a period");
const innerPeriods = stripped.slice(0, -1).match(/\./g) ?? [];
if (innerPeriods.length !== 0) {
  throw new Error("entry has a period before its final character");
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "entry.txt"), entry, "utf8");

// Round-trip check: the file must read back byte-identical to the line.
const back = fs.readFileSync(path.join(outDir, "entry.txt"), "utf8");
if (back !== entry) throw new Error("round-trip mismatch");
console.log(`entry ok: ${entry.length} chars`);
