import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed token that lets the buyer view their own confirmation page without
 * an account. Order numbers alone are guessable-ish; the HMAC is not.
 */
function secret() {
  const s = process.env.ORDER_TOKEN_SECRET;
  if (!s || s.length < 32) throw new Error("ORDER_TOKEN_SECRET must be set (32+ chars)");
  return s;
}

export function hasOrderTokenSecret() {
  return (process.env.ORDER_TOKEN_SECRET?.length ?? 0) >= 32;
}

export function signOrder(orderNumber: string) {
  return createHmac("sha256", secret()).update(orderNumber).digest("base64url").slice(0, 32);
}

export function verifyOrder(orderNumber: string, token: string | undefined) {
  if (!token) return false;
  const a = Buffer.from(signOrder(orderNumber));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
