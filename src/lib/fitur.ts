import "server-only";
import type { RowDataPacket } from "mysql2";
import { db } from "./db";

export const FITUR = ["presensi", "post_test"] as const;
export type Fitur = (typeof FITUR)[number];
export type StatusFitur = Record<Fitur, boolean>;

/** Status buka/tutup tiap fitur. Fitur tanpa baris di database dianggap terbuka. */
export async function getStatusFitur(): Promise<StatusFitur> {
  const [rows] = await db.query<RowDataPacket[]>("SELECT fitur, buka FROM pengaturan_fitur");
  const status: StatusFitur = { presensi: true, post_test: true };
  for (const r of rows) if (r.fitur in status) status[r.fitur as Fitur] = !!r.buka;
  return status;
}

export async function setFitur(fitur: Fitur, buka: boolean) {
  await db.execute(
    "INSERT INTO pengaturan_fitur (fitur, buka) VALUES (?, ?) ON DUPLICATE KEY UPDATE buka = VALUES(buka)",
    [fitur, buka ? 1 : 0],
  );
}
