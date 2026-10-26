/**
 * Tamper-evident audit log, after BreachMirror AI's server/security/audit-log.ts.
 *
 * Every entry carries the HMAC of the previous entry, so editing, deleting or
 * reordering any entry breaks the chain. Kept in memory like the rest of the demo
 * data; the key comes from AUDIT_KEY, or a random one per server start.
 */
import crypto from "crypto";

export type AuditDetails = Record<string, string | number | boolean | null>;

export type AuditEntry = {
  seq: number;
  at: string;
  userId: string;
  event: string;
  details: AuditDetails;
  prev: string;
  hash: string;
};

const KEY = process.env.AUDIT_KEY ? Buffer.from(process.env.AUDIT_KEY, "utf8") : crypto.randomBytes(32);
const GENESIS = "genesis";
const MAX_ENTRIES = 2000;

const entries: AuditEntry[] = [];
let anchor = GENESIS;

const digest = (e: Omit<AuditEntry, "hash">) =>
  crypto.createHmac("sha256", KEY).update(JSON.stringify([e.seq, e.at, e.userId, e.event, e.details, e.prev])).digest("hex");

export function audit(userId: string, event: string, details: AuditDetails = {}): AuditEntry {
  const last = entries[entries.length - 1];
  const base = { seq: (last?.seq ?? 0) + 1, at: new Date().toISOString(), userId, event, details, prev: last?.hash ?? anchor };
  const entry = { ...base, hash: digest(base) };
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) anchor = entries.shift()!.hash;
  return entry;
}

export function verifyAudit(): { valid: boolean; entries: number; brokenAtSeq?: number } {
  let previous = anchor;
  for (const entry of entries) {
    const { hash, ...rest } = entry;
    if (entry.prev !== previous || digest(rest) !== hash) return { valid: false, entries: entries.length, brokenAtSeq: entry.seq };
    previous = hash;
  }
  return { valid: true, entries: entries.length };
}

/** A user's own entries, newest first */
export function auditFor(userId: string, limit = 50): AuditEntry[] {
  return entries.filter(e => e.userId === userId).slice(-limit).reverse();
}
