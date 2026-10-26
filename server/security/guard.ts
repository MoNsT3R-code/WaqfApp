/**
 * Input guard for the assistant, after BreachMirror AI's guard node: blocks
 * prompt-injection attempts and redacts secrets before anything is searched or
 * sent to a model. Adds the secrets a wallet customer might type: PINs, OTPs,
 * card numbers, CNICs and passwords.
 */

const INJECTION_PATTERNS = [
  /ignore (all |any |the )?(previous|prior|above) (instructions|prompts?|rules)/i,
  /(reveal|show|print|repeat) (your|the) (system )?(prompt|instructions)/i,
  /\b(jailbreak|dan mode|developer mode)\b/i,
  /you are now\b/i,
  /disregard (your|the) (rules|guidelines|instructions)/i,
];

// Luhn check, so long order numbers are not mistaken for card numbers
const luhn = (digits: string) => {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
};

// For patterns with a (?<keep>…) group, only the secret after it is replaced, so "my PIN is 1234"
// becomes "my PIN is [REDACTED]" and the question can still be matched to the PIN answers.
const SECRET_PATTERNS: Array<[RegExp, string, ((match: string) => boolean)?]> = [
  [/\b(?:\d[ -]?){13,19}\b/g, "card number", m => luhn(m.replace(/\D/g, ""))],
  [/\b\d{5}-\d{7}-\d\b/g, "CNIC number"],
  [/(?<keep>\b(?:pin|otp|one[- ]time code|verification code)\s*(?:is|:|=)?\s*)\d{4,8}\b/gi, "PIN or one-time code"],
  [/(?<keep>\b(?:password|passwd|pwd)\s*(?:is|:|=)\s*)\S+/gi, "password"],
  [/AKIA[0-9A-Z]{16}/g, "AWS access key"],
  [/gh[pousr]_[A-Za-z0-9_]{20,}/g, "GitHub token"],
  [/sk-[A-Za-z0-9_-]{20,}/g, "API secret key"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(-----END [A-Z ]*PRIVATE KEY-----|$)/g, "private key"],
];

export type GuardResult =
  | { route: "blocked"; text: string; found: string[] }
  | { route: "ok"; text: string; found: string[] };

export function guardInput(input: string): GuardResult {
  const text = input.trim();
  if (INJECTION_PATTERNS.some(p => p.test(text))) return { route: "blocked", text, found: [] };
  const found = new Set<string>();
  let output = text;
  for (const [pattern, label, accept] of SECRET_PATTERNS) {
    output = output.replace(pattern, (match: string, ...rest: unknown[]) => {
      if (accept && !accept(match)) return match;
      found.add(label);
      const groups = rest[rest.length - 1] as Record<string, string> | undefined;
      return `${(typeof groups === "object" && groups?.keep) || ""}[REDACTED]`;
    });
  }
  return { route: "ok", text: output, found: [...found] };
}
