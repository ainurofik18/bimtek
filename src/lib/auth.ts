import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const COOKIE_DASHBOARD = "bimtek_dash";

const sha256 = (s: string) => createHash("sha256").update(s).digest();

/** Cocokkan key kiriman dengan env API_KEY (constant-time). */
export function keyValid(kirim: string) {
  const key = process.env.API_KEY?.trim();
  return !!key && timingSafeEqual(sha256(kirim), sha256(key));
}

/** Nilai cookie sesi dashboard: hash dari API_KEY, jadi key asli tidak disimpan di browser. */
export function tokenSesi() {
  return sha256(process.env.API_KEY?.trim() ?? "").toString("hex");
}

export async function sudahLogin() {
  const key = process.env.API_KEY?.trim();
  const v = (await cookies()).get(COOKIE_DASHBOARD)?.value;
  return !!key && !!v && tokenValid(v);
}

function tokenValid(token: string) {
  const a = Buffer.from(token);
  const b = Buffer.from(tokenSesi());
  return a.length === b.length && timingSafeEqual(a, b);
}
