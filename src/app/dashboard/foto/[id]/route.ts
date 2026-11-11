import { readFile } from "node:fs/promises";
import path from "node:path";
import type { RowDataPacket } from "mysql2";
import { sudahLogin } from "@/lib/auth";
import { db } from "@/lib/db";
import { storageDir } from "@/lib/storage";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await sudahLogin())) return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  if (!/^\d+$/.test(id)) return new Response("Not found", { status: 404 });

  const [rows] = await db.query<RowDataPacket[]>("SELECT foto FROM presensis WHERE id = ? LIMIT 1", [id]);
  if (rows.length === 0) return new Response("Not found", { status: 404 });

  // Path berasal dari database (bukan input user), tetap dipastikan berada di dalam storage.
  const root = storageDir();
  const file = path.resolve(root, rows[0].foto);
  if (!file.startsWith(root + path.sep)) return new Response("Not found", { status: 404 });

  try {
    return new Response(new Uint8Array(await readFile(file)), {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=3600" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
