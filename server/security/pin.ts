/**
 * PIN confirmation for money that leaves the budget: savings moves, transfers and
 * Quick Loans. The PIN is kept only as a salted scrypt hash and compared in
 * constant time; three wrong tries lock PIN actions for five minutes.
 *
 * The demo account's PIN comes from WAQF_DEMO_PIN (default 2580, as in the
 * Smart Spend & Save prototype). It is a test value, not a real credential.
 */
import crypto from "crypto";
import { audit } from "./audit.ts";

const SALT = crypto.randomBytes(16);
const hash = (pin: string) => crypto.scryptSync(pin, SALT, 32);
const DEMO_PIN_HASH = hash(process.env.WAQF_DEMO_PIN || "2580");

const MAX_TRIES = 3;
const LOCK_MS = 5 * 60 * 1000;
const state = new Map<string, { failures: number; lockedUntil: number }>();

export type PinResult = { ok: true } | { ok: false; reason: "missing" | "wrong" | "locked"; triesLeft: number; message: string };

export function checkPin(userId: string, pin: unknown, action: string): PinResult {
  const s = state.get(userId) || { failures: 0, lockedUntil: 0 };
  if (Date.now() < s.lockedUntil) {
    return { ok: false, reason: "locked", triesLeft: 0, message: "Too many wrong PIN attempts. PIN actions are paused for a few minutes." };
  }
  if (typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
    return { ok: false, reason: "missing", triesLeft: MAX_TRIES - s.failures, message: "Confirming this needs your 4-digit PIN." };
  }
  if (crypto.timingSafeEqual(hash(pin), DEMO_PIN_HASH)) {
    state.delete(userId);
    return { ok: true };
  }
  s.failures += 1;
  audit(userId, "pin_failed", { action, attempt: s.failures });
  if (s.failures >= MAX_TRIES) {
    s.failures = 0;
    s.lockedUntil = Date.now() + LOCK_MS;
    state.set(userId, s);
    audit(userId, "pin_locked", { action, minutes: LOCK_MS / 60000 });
    return { ok: false, reason: "locked", triesLeft: 0, message: "That PIN didn’t match 3 times, so nothing was done. PIN actions are paused for 5 minutes." };
  }
  state.set(userId, s);
  const left = MAX_TRIES - s.failures;
  return { ok: false, reason: "wrong", triesLeft: left, message: `That PIN didn’t match. ${left} ${left === 1 ? "try" : "tries"} left.` };
}

/**
 * Replays of the same confirmation (a double tap, a retried request) return the
 * first answer instead of acting twice. Keys expire after ten minutes.
 */
const seen = new Map<string, { at: number; body: unknown; status: number }>();

export function replay(userId: string, requestId: unknown): { status: number; body: unknown } | null {
  if (typeof requestId !== "string" || !requestId) return null;
  const hit = seen.get(`${userId}:${requestId}`);
  return hit && Date.now() - hit.at < 600_000 ? hit : null;
}

export function remember(userId: string, requestId: unknown, status: number, body: unknown) {
  if (typeof requestId !== "string" || !requestId) return;
  seen.set(`${userId}:${requestId}`, { at: Date.now(), status, body });
  if (seen.size > 5000) seen.delete(seen.keys().next().value!);
}
