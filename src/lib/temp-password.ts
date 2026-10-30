import { randomInt } from "node:crypto";

// No look-alike characters (0/O, 1/l/I) so it can be read out or typed by hand
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** One-time password an owner hands to a user; they must change it on first sign-in. */
export function generateTempPassword(length = 14): string {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}
