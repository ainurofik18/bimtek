import "server-only";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { tanggalWib } from "@/lib/validasi";

export type FilterPresensi = { semua: boolean; tanggal: string; q: string };

/** Baca filter dashboard presensi dari query string (default: hari ini, tanpa pencarian). */
export function parseFilterPresensi(sp: { tanggal?: string; q?: string }): FilterPresensi {
  return {
    semua: sp.tanggal === "semua",
    tanggal: /^\d{4}-\d{2}-\d{2}$/.test(sp.tanggal ?? "") ? sp.tanggal! : tanggalWib(),
    q: (sp.q ?? "").trim().slice(0, 100),
  };
}

export async function ambilPresensi({ semua, tanggal, q }: FilterPresensi) {
  const where: string[] = [];
  const params: string[] = [];
  if (!semua) {
    where.push("p.tanggal = ?");
    params.push(tanggal);
  }
  if (q) {
    where.push("(p.nama LIKE ? OR p.nip LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT p.id, p.nama, p.nip, p.no_hp, p.tanggal, p.foto, p.created_at,
            COALESCE(s.nama_skpd, p.kode_skpd) AS skpd
       FROM presensis p
       LEFT JOIN master_skpds s ON s.kode_skpd = p.kode_skpd
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY p.created_at ASC, p.id ASC`,
    params,
  );
  return rows;
}

/**
 * Daftar peserta unik (satu baris per NIP) yang pernah presensi, urut waktu presensi pertama.
 * Nama diambil dari presensi pertama.
 */
export async function ambilPesertaUnik() {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT p.nip, p.nama
       FROM presensis p
       JOIN (SELECT nip, MIN(id) AS id FROM presensis GROUP BY nip) f ON f.id = p.id
      ORDER BY p.created_at ASC, p.id ASC`,
  );
  return rows.map((r, i) => ({ no: i + 1, nip: String(r.nip), nama: String(r.nama) }));
}
