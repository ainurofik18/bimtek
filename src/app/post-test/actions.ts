"use server";

import { headers } from "next/headers";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { db, isDuplicateError } from "@/lib/db";
import { bersihkanNama, bersihkanNip, validasiNama, validasiNip } from "@/lib/validasi";

export type PostTestState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<"nama" | "nip" | "kode_skpd" | "saran" | "jawaban", string>>;
    }
  | { status: "success"; nama: string; jumlahSoal: number; jumlahBenar: number; nilai: number };

const PILIHAN_VALID = new Set(["A", "B", "C", "D", "E"]);
const SARAN_MIN = 10;
const SARAN_MAX = 3000;

export async function simpanPostTest(
  _prev: PostTestState,
  formData: FormData,
): Promise<PostTestState> {
  const nama = bersihkanNama(formData.get("nama"));
  const nip = bersihkanNip(formData.get("nip"));
  const kodeSkpd = String(formData.get("kode_skpd") ?? "").trim();
  const saran = String(formData.get("saran") ?? "").trim();

  const fieldErrors: NonNullable<Extract<PostTestState, { status: "error" }>["fieldErrors"]> = {};
  const eNama = validasiNama(nama);
  if (eNama) fieldErrors.nama = eNama;
  const eNip = validasiNip(nip);
  if (eNip) fieldErrors.nip = eNip;
  if (!kodeSkpd) fieldErrors.kode_skpd = "Silakan pilih SKPD.";
  if (saran.length < SARAN_MIN) fieldErrors.saran = `Saran/masukan minimal ${SARAN_MIN} karakter.`;
  if (saran.length > SARAN_MAX) fieldErrors.saran = `Saran/masukan maksimal ${SARAN_MAX} karakter.`;

  // Kunci jawaban hanya dibaca di server.
  const [soalRows] = await db.query<RowDataPacket[]>(
    "SELECT id, kunci_jawaban FROM soal_post_tests WHERE aktif = 1 ORDER BY urutan, id",
  );
  if (soalRows.length === 0) {
    return { status: "error", message: "Soal post test belum tersedia." };
  }

  const jawaban = soalRows.map((s) => {
    const j = String(formData.get(`soal_${s.id}`) ?? "").toUpperCase();
    return { soalId: s.id as number, jawaban: j, benar: j === s.kunci_jawaban };
  });
  const belum = jawaban.filter((j) => !PILIHAN_VALID.has(j.jawaban)).length;
  if (belum > 0) fieldErrors.jawaban = `Masih ada ${belum} soal yang belum dijawab.`;

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Periksa kembali isian Anda.", fieldErrors };
  }

  const [skpdRows] = await db.query<RowDataPacket[]>(
    "SELECT 1 FROM master_skpds WHERE kode_skpd = ? LIMIT 1",
    [kodeSkpd],
  );
  if (skpdRows.length === 0) {
    return {
      status: "error",
      message: "Periksa kembali isian Anda.",
      fieldErrors: { kode_skpd: "SKPD tidak ditemukan." },
    };
  }

  const jumlahSoal = jawaban.length;
  const jumlahBenar = jawaban.filter((j) => j.benar).length;
  const nilai = Math.round((jumlahBenar / jumlahSoal) * 10000) / 100;

  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim() || null;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [res] = await conn.execute<ResultSetHeader>(
      `INSERT INTO post_tests (nama, nip, kode_skpd, jumlah_soal, jumlah_benar, nilai, saran, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nama, nip, kodeSkpd, jumlahSoal, jumlahBenar, nilai, saran, ip],
    );
    await conn.query(
      "INSERT INTO post_test_jawabans (post_test_id, soal_id, jawaban, benar) VALUES ?",
      [jawaban.map((j) => [res.insertId, j.soalId, j.jawaban, j.benar ? 1 : 0])],
    );
    await conn.commit();
  } catch (err) {
    await conn.rollback().catch(() => {});
    if (isDuplicateError(err)) {
      return { status: "error", message: "NIP ini sudah pernah mengisi post test." };
    }
    console.error("Gagal menyimpan post test:", err);
    return { status: "error", message: "Terjadi kesalahan server. Silakan coba lagi." };
  } finally {
    conn.release();
  }

  return { status: "success", nama, jumlahSoal, jumlahBenar, nilai };
}
