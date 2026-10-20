"use server";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import type { RowDataPacket } from "mysql2";
import { db, isDuplicateError } from "@/lib/db";
import {
  bersihkanNama,
  bersihkanNip,
  bersihkanNoHp,
  tanggalWib,
  validasiNama,
  validasiNip,
  validasiNoHp,
} from "@/lib/validasi";

export type PresensiState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Partial<Record<FieldName, string>> }
  | { status: "success"; nama: string; nip: string; skpd: string; waktu: string };

type FieldName = "nama" | "nip" | "kode_skpd" | "no_hp" | "foto";

const MAX_FOTO_BYTES = 3 * 1024 * 1024;

function storageDir() {
  return path.resolve(
    /*turbopackIgnore: true*/ process.env.STORAGE_DIR || path.join(process.cwd(), "storage"),
  );
}

export async function simpanPresensi(
  _prev: PresensiState,
  formData: FormData,
): Promise<PresensiState> {
  const nama = bersihkanNama(formData.get("nama"));
  const nip = bersihkanNip(formData.get("nip"));
  const kodeSkpd = String(formData.get("kode_skpd") ?? "").trim();
  const noHp = bersihkanNoHp(formData.get("no_hp"));
  const foto = formData.get("foto");

  const fieldErrors: Partial<Record<FieldName, string>> = {};
  const eNama = validasiNama(nama);
  if (eNama) fieldErrors.nama = eNama;
  const eNip = validasiNip(nip);
  if (eNip) fieldErrors.nip = eNip;
  if (!kodeSkpd) fieldErrors.kode_skpd = "Silakan pilih SKPD.";
  const eHp = validasiNoHp(noHp);
  if (eHp) fieldErrors.no_hp = eHp;

  let fotoBuffer: Buffer | null = null;
  if (!(foto instanceof File) || foto.size === 0) {
    fieldErrors.foto = "Silakan ambil foto selfie terlebih dahulu.";
  } else if (foto.size > MAX_FOTO_BYTES) {
    fieldErrors.foto = "Ukuran foto terlalu besar.";
  } else {
    fotoBuffer = Buffer.from(await foto.arrayBuffer());
    // Pastikan benar-benar JPEG (magic bytes FF D8 FF)
    if (fotoBuffer[0] !== 0xff || fotoBuffer[1] !== 0xd8 || fotoBuffer[2] !== 0xff) {
      fieldErrors.foto = "Format foto tidak valid.";
      fotoBuffer = null;
    }
  }

  if (Object.keys(fieldErrors).length > 0 || !fotoBuffer) {
    return { status: "error", message: "Periksa kembali isian Anda.", fieldErrors };
  }

  const [skpdRows] = await db.query<RowDataPacket[]>(
    "SELECT nama_skpd FROM master_skpds WHERE kode_skpd = ? LIMIT 1",
    [kodeSkpd],
  );
  if (skpdRows.length === 0) {
    return {
      status: "error",
      message: "Periksa kembali isian Anda.",
      fieldErrors: { kode_skpd: "SKPD tidak ditemukan." },
    };
  }
  const namaSkpd: string = skpdRows[0].nama_skpd ?? kodeSkpd;

  const tanggal = tanggalWib();
  const [sudah] = await db.query<RowDataPacket[]>(
    "SELECT id FROM presensis WHERE nip = ? AND tanggal = ? LIMIT 1",
    [nip, tanggal],
  );
  if (sudah.length > 0) {
    return { status: "error", message: "NIP ini sudah melakukan presensi hari ini." };
  }

  // Simpan foto: storage/presensi/YYYY-MM-DD/<nip>-<acak>.jpg
  const relPath = path.posix.join(
    "presensi",
    tanggal,
    `${nip}-${Date.now()}-${randomBytes(4).toString("hex")}.jpg`,
  );
  const absPath = path.join(storageDir(), relPath);
  await mkdir(path.dirname(absPath), { recursive: true });
  await writeFile(absPath, fotoBuffer);

  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim() || null;
  const ua = h.get("user-agent")?.slice(0, 255) ?? null;

  try {
    await db.execute(
      `INSERT INTO presensis (nama, nip, kode_skpd, no_hp, foto, tanggal, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nama, nip, kodeSkpd, noHp, relPath, tanggal, ip, ua],
    );
  } catch (err) {
    await unlink(absPath).catch(() => {});
    if (isDuplicateError(err)) {
      return { status: "error", message: "NIP ini sudah melakukan presensi hari ini." };
    }
    console.error("Gagal menyimpan presensi:", err);
    return { status: "error", message: "Terjadi kesalahan server. Silakan coba lagi." };
  }

  const waktu = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date());

  return { status: "success", nama, nip, skpd: namaSkpd, waktu: `${waktu} WIB` };
}
