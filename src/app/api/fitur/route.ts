import type { NextRequest } from "next/server";
import { keyValid } from "@/lib/auth";
import { FITUR, getStatusFitur, setFitur, type Fitur } from "@/lib/fitur";

/**
 * GET /api/fitur?api_key=KEY                                → lihat status
 * GET /api/fitur?api_key=KEY&fitur=presensi&buka=1          → buka presensi
 * GET /api/fitur?api_key=KEY&fitur=post_test&buka=0         → tutup post test
 *
 * fitur: presensi | post_test      buka: 1 | 0
 */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  if (!keyValid(p.get("api_key") ?? "")) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const fitur = p.get("fitur");
  if (fitur !== null) {
    const buka = p.get("buka");
    if (!FITUR.includes(fitur as Fitur) || (buka !== "1" && buka !== "0")) {
      return Response.json({ message: "Parameter: fitur=presensi|post_test dan buka=1|0" }, { status: 400 });
    }
    await setFitur(fitur as Fitur, buka === "1");
  }

  return Response.json(await getStatusFitur());
}
