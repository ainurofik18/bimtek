import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { FITUR, getStatusFitur, setFitur, type Fitur } from "@/lib/fitur";

// Autentikasi: header `Authorization: Bearer <API_KEY>` atau `X-API-Key: <API_KEY>`.
function izinkan(req: NextRequest) {
  const key = process.env.API_KEY?.trim();
  if (!key) return false;
  const kirim = req.headers.get("x-api-key") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(kirim);
  const b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}

const tolak = () => Response.json({ message: "Unauthorized" }, { status: 401 });

/** GET /api/fitur → { presensi: true, post_test: false } */
export async function GET(req: NextRequest) {
  if (!izinkan(req)) return tolak();
  return Response.json(await getStatusFitur());
}

/** POST /api/fitur  body: { "fitur": "presensi" | "post_test", "buka": true | false } */
export async function POST(req: NextRequest) {
  if (!izinkan(req)) return tolak();

  const body = await req.json().catch(() => null);
  if (!FITUR.includes(body?.fitur) || typeof body?.buka !== "boolean") {
    return Response.json(
      { message: 'Body harus { "fitur": "presensi" | "post_test", "buka": true | false }' },
      { status: 400 },
    );
  }

  await setFitur(body.fitur as Fitur, body.buka);
  return Response.json(await getStatusFitur());
}
