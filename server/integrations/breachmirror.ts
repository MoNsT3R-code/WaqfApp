/**
 * Connection to BreachMirror AI (github.com/MoNsT3R-code/BreachMirror-AI), the
 * security-awareness platform whose policies and guard the assistant uses.
 *
 * WaqfApp reads BreachMirror's public health endpoint (no sign-in needed) to show
 * whether it is running and whether its encrypted, hash-chained audit log is
 * intact, and links people to its Policy Copilot and Security Support. Its policy
 * API needs a BreachMirror session, so questions are not sent to it from here.
 */

export const BREACHMIRROR_URL = (process.env.BREACHMIRROR_URL || "http://localhost:3000").replace(/\/+$/, "");

type Health = { status: string; uptime: number; encryption: string; keySource: string; auditChain: string; rag: string; geminiConfigured: boolean };
export type BreachMirrorStatus =
  | { connected: true; url: string; checkedAt: string; health: Health }
  | { connected: false; url: string; checkedAt: string; reason: string };

let cached: { at: number; value: BreachMirrorStatus } | null = null;

export async function breachMirrorStatus(selfPort: number): Promise<BreachMirrorStatus> {
  if (cached && Date.now() - cached.at < 15_000) return cached.value;
  const checkedAt = new Date().toISOString();
  let value: BreachMirrorStatus;
  if (new URL(BREACHMIRROR_URL).port === String(selfPort) && /localhost|127\.0\.0\.1/.test(BREACHMIRROR_URL)) {
    value = { connected: false, url: BREACHMIRROR_URL, checkedAt, reason: "BREACHMIRROR_URL points at WaqfApp itself. Run BreachMirror on its own port and set BREACHMIRROR_URL." };
  } else {
    try {
      const res = await fetch(`${BREACHMIRROR_URL}/local-api/health`, { signal: AbortSignal.timeout(2500), headers: { accept: "application/json" } });
      const health = (await res.json()) as Health;
      // Only a real BreachMirror answers with its own fields
      value = res.ok && health?.status === "ONLINE" && typeof health.auditChain === "string"
        ? { connected: true, url: BREACHMIRROR_URL, checkedAt, health }
        : { connected: false, url: BREACHMIRROR_URL, checkedAt, reason: `BreachMirror did not answer as expected (HTTP ${res.status}).` };
    } catch (e: any) {
      value = { connected: false, url: BREACHMIRROR_URL, checkedAt, reason: e?.name === "TimeoutError" ? "BreachMirror did not answer within 2.5 seconds." : "BreachMirror is not running at this address." };
    }
  }
  cached = { at: Date.now(), value };
  return value;
}

/** Security questions the FAQ cannot answer are pointed to BreachMirror's Security Team */
const SECURITY_TOPIC = /\b(secur|phish|scam|fraud|hack|breach|malware|virus|password|pin|otp|stolen|leak|privacy|suspicious|spoof|identity)\w*/i;
export const isSecurityQuestion = (text: string) => SECURITY_TOPIC.test(text);
