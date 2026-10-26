/**
 * Imports BreachMirror AI's security policies into the assistant's knowledge base.
 *
 *   npm run policies:import -- <path to a BreachMirror-AI checkout>
 *
 * Reads src/data/handbook-content.ts (the IT Security Policy) and
 * src/data/conduct-content.ts (the Code of Business Conduct) from that checkout
 * and writes docs/policies/*.md: one "##" entry per clause, scenario or rule set,
 * each heading naming its section so the assistant's answers cite it.
 */
import fs from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";

const source = process.argv[2] || process.env.BREACHMIRROR_DIR;
if (!source) {
  console.error("Usage: npm run policies:import -- <path to BreachMirror-AI>");
  process.exit(1);
}
const data = path.resolve(source, "src", "data");
const out = path.resolve(import.meta.dirname, "..", "docs", "policies");

const load = (file: string) => import(pathToFileURL(path.join(data, file)).href);
const clean = (text: string) => text.replace(/\s+/g, " ").trim();
const sentence = (value: string) => (/[.!?]$/.test(value.trim()) ? value.trim() : `${value.trim()}.`);

// Long passages are split into windows of about 700 characters at sentence ends
function windows(text: string, size = 700): string[] {
  // A sentence ends at . ! or ? followed by a space and a capital or a digit, so
  // "maya.patel@xyz.com" and "v7.0" stay whole
  const sentences = clean(text).split(/(?<=[.!?])\s+(?=[A-Z0-9“"(])/);
  const result: string[] = [];
  let current = "";
  for (const s of sentences) {
    if (current && current.length + s.length > size) { result.push(current.trim()); current = ""; }
    current += `${s} `;
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

function entries(heading: string, text: string) {
  const parts = windows(text);
  return parts.map((part, i) => `## ${heading}${parts.length > 1 ? ` (part ${i + 1} of ${parts.length})` : ""}\n\n${part}\n`);
}

const handbook = await load("handbook-content.ts");
const conduct = await load("conduct-content.ts");
const meta = handbook.XYZ_POLICY_METADATA;
const corp = conduct.XYZ_CORP_METADATA;

// --- IT Security Policy: each section's summary and directives, then each numbered clause
const policy: string[] = [
  `# ${meta.documentTitle} Policy ${meta.version} (BreachMirror AI)\n`,
  `<!-- Imported from BreachMirror AI src/data/handbook-content.ts. ${meta.copyright}. Effective ${meta.effectiveDate}, revised ${meta.lastRevised}. Scope: ${meta.scope} Do not edit by hand; run npm run policies:import. -->\n`,
];
for (const section of handbook.XYZ_POLICY_SECTIONS) {
  policy.push(...entries(
    `Security policy, section ${section.number}: ${section.title}`,
    `${sentence(section.summary)} Key directives: ${section.keyDirectives.map(sentence).join(" ")}`,
  ));
  // "1.1 Classification Tiers. …" clauses on their own lines
  const clauses = section.fullText.split(/\n(?=\d+\.\d+\s)/).slice(1);
  for (const clause of clauses) {
    const m = clause.match(/^(\d+\.\d+)\s+([^.]+)\.\s*([\s\S]*)$/);
    if (!m) continue;
    policy.push(...entries(`Security policy ${m[1]}: ${clean(m[2])} (${section.title})`, m[3]));
  }
}

// --- Code of Business Conduct: each rule set, then the "Know the Code" scenarios
const code: string[] = [
  `# ${corp.title ?? "Code of Business Conduct"} (BreachMirror AI)\n`,
  `<!-- Imported from BreachMirror AI src/data/conduct-content.ts. Do not edit by hand; run npm run policies:import. -->\n`,
];
for (const pillar of conduct.XYZ_CODE_PILLARS) {
  for (const sub of pillar.subtopics) {
    code.push(...entries(
      `Code of conduct ${pillar.number}: ${sub.title} (${pillar.title})`,
      [sub.summary, ...sub.keyRules, sub.fullNarrative, ...(sub.keyTerms ?? []).map((t: any) => `${t.term}: ${t.definition}`)].map(sentence).join(" "),
    ));
  }
}
for (const scenario of conduct.XYZ_KNOW_THE_CODE_SCENARIOS) {
  code.push(...entries(
    `Know the Code: ${clean(scenario.question)}`,
    [scenario.answer, scenario.explanation, ...scenario.actionProtocol, scenario.relevantContact].map(sentence).join(" "),
  ));
}

await fs.mkdir(out, { recursive: true });
await fs.writeFile(path.join(out, "breachmirror-it-security-policy.md"), policy.join("\n"), "utf-8");
await fs.writeFile(path.join(out, "breachmirror-code-of-conduct.md"), code.join("\n"), "utf-8");
const count = (lines: string[]) => lines.filter(l => l.startsWith("## ")).length;
console.log(`Wrote docs/policies: ${count(policy)} security policy entries, ${count(code)} code of conduct entries`);
