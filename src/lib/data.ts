import "server-only";
import { connection } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "./db";

export type Skpd = { kode_skpd: string; nama_skpd: string };

export type Pilihan = "A" | "B" | "C" | "D" | "E";

/** Soal tanpa kunci jawaban — aman dikirim ke browser. */
export type SoalPublik = {
  id: number;
  pertanyaan: string;
  pilihan: { kode: Pilihan; teks: string }[];
};

export async function getSkpds(): Promise<Skpd[]> {
  await connection();
  const [rows] = await db.query<(Skpd & RowDataPacket)[]>(
    "SELECT kode_skpd, nama_skpd FROM master_skpds ORDER BY kode_skpd",
  );
  return rows.map((r) => ({ kode_skpd: r.kode_skpd, nama_skpd: r.nama_skpd ?? r.kode_skpd }));
}

export async function getSoalPublik(): Promise<SoalPublik[]> {
  await connection();
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, pilihan_e
       FROM soal_post_tests
      WHERE aktif = 1
      ORDER BY urutan, id`,
  );
  return rows.map((r) => ({
    id: r.id,
    pertanyaan: r.pertanyaan,
    pilihan: (["A", "B", "C", "D", "E"] as const)
      .map((kode) => ({ kode, teks: r[`pilihan_${kode.toLowerCase()}`] as string | null }))
      .filter((p): p is { kode: Pilihan; teks: string } => !!p.teks && p.teks.trim() !== ""),
  }));
}
