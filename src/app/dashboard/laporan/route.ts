import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, PDFFont, PDFImage, PDFPage, StandardFonts, rgb } from "pdf-lib";
import sharp from "sharp";
import { ACARA } from "@/lib/acara";
import { sudahLogin } from "@/lib/auth";
import { ambilPresensi, parseFilterPresensi } from "@/lib/presensi";
import { storageDir } from "@/lib/storage";

// A4 portrait, satuan poin (1 pt = 1/72 inci)
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 36;
const FONT_SIZE = 8.5;
const LINE_H = 11;
const PAD = 4;
const FOTO_W = 52;
const FOTO_H = 39; // rasio 4:3, sama dengan hasil kamera selfie
const ROW_H_MIN = FOTO_H + PAD * 2;

const COLS = [
  { key: "no", label: "No", w: 28 },
  { key: "nip", label: "NIP", w: 108 },
  { key: "nama", label: "Nama", w: 122 },
  { key: "skpd", label: "SKPD", w: 120 },
  { key: "hp", label: "No. HP", w: 80 },
  { key: "foto", label: "Foto", w: 65 },
] as const;
const TABLE_W = COLS.reduce((a, c) => a + c.w, 0);

const HITAM = rgb(0.1, 0.1, 0.1);
const ABU = rgb(0.45, 0.45, 0.45);
const GARIS = rgb(0.75, 0.75, 0.75);
const HEADER_BG = rgb(0.93, 0.95, 0.94);

export async function GET(req: Request) {
  if (!(await sudahLogin())) return new Response("Unauthorized", { status: 401 });

  const filter = parseFilterPresensi(Object.fromEntries(new URL(req.url).searchParams));
  const rows = (await ambilPresensi(filter)).sort((a, b) =>
    String(a.nama).localeCompare(String(b.nama), "id"),
  );

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Foto dikecilkan dulu (±5 KB/foto) supaya PDF ringan walau pesertanya ratusan.
  const root = storageDir();
  const fotos: (PDFImage | null)[] = [];
  for (let i = 0; i < rows.length; i += 8) {
    const batch = await Promise.all(
      rows.slice(i, i + 8).map(async (r) => {
        try {
          const file = path.resolve(root, String(r.foto));
          if (!file.startsWith(root + path.sep)) return null;
          const kecil = await sharp(await readFile(file))
            .rotate()
            .resize(FOTO_W * 3, FOTO_H * 3, { fit: "cover" })
            .jpeg({ quality: 70 })
            .toBuffer();
          return await pdf.embedJpg(kecil);
        } catch {
          return null;
        }
      }),
    );
    fotos.push(...batch);
  }

  const judul = filter.semua
    ? "Semua tanggal"
    : new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeZone: "UTC" }).format(
        new Date(`${filter.tanggal}T00:00:00Z`),
      );

  let page: PDFPage;
  let y = 0;

  function halamanBaru(pertama: boolean) {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
    if (pertama) {
      const tengah = (t: string, f: PDFFont, size: number) =>
        page.drawText(aman(t, f), {
          x: (PAGE_W - f.widthOfTextAtSize(aman(t, f), size)) / 2,
          y: y - size,
          size,
          font: f,
          color: HITAM,
        });
      tengah("DAFTAR HADIR PESERTA", bold, 14);
      y -= 18;
      tengah(`${ACARA.judul} Tahun ${ACARA.tahun}`, font, 10);
      y -= 13;
      tengah(`${ACARA.penyelenggara} ${ACARA.daerah}`, font, 10);
      y -= 13;
      tengah(
        `${judul} — ${rows.length} peserta${filter.q ? ` (pencarian: "${filter.q}")` : ""}`,
        font,
        9,
      );
      y -= 20;
    }
    // Header tabel (diulang di setiap halaman)
    const hh = LINE_H + PAD * 2;
    page.drawRectangle({
      x: MARGIN,
      y: y - hh,
      width: TABLE_W,
      height: hh,
      color: HEADER_BG,
      borderColor: GARIS,
      borderWidth: 0.5,
    });
    let x = MARGIN;
    for (const c of COLS) {
      page.drawText(c.label, { x: x + PAD, y: y - PAD - FONT_SIZE, size: FONT_SIZE, font: bold, color: HITAM });
      x += c.w;
    }
    y -= hh;
  }

  halamanBaru(true);

  rows.forEach((r, i) => {
    const nama = wrap(aman(String(r.nama), font), font, COLS[2].w - PAD * 2);
    const skpd = wrap(aman(String(r.skpd ?? ""), font), font, COLS[3].w - PAD * 2);
    const rowH = Math.max(ROW_H_MIN, Math.max(nama.length, skpd.length) * LINE_H + PAD * 2);

    if (y - rowH < MARGIN + 20) halamanBaru(false);

    const top = y;
    const teks = (lines: string[], colIdx: number) => {
      const x = MARGIN + COLS.slice(0, colIdx).reduce((a, c) => a + c.w, 0) + PAD;
      lines.forEach((ln, k) =>
        page.drawText(ln, { x, y: top - PAD - FONT_SIZE - k * LINE_H, size: FONT_SIZE, font, color: HITAM }),
      );
    };
    teks([String(i + 1)], 0);
    teks([String(r.nip)], 1);
    teks(nama, 2);
    teks(skpd, 3);
    teks([String(r.no_hp)], 4);

    const img = fotos[i];
    const fx = MARGIN + TABLE_W - COLS[5].w + (COLS[5].w - FOTO_W) / 2;
    if (img) {
      page.drawImage(img, { x: fx, y: top - PAD - FOTO_H, width: FOTO_W, height: FOTO_H });
    } else {
      page.drawText("tidak ada", { x: fx + 8, y: top - PAD - 20, size: 7, font, color: ABU });
    }

    // Garis bawah baris + garis kolom
    page.drawLine({ start: { x: MARGIN, y: top - rowH }, end: { x: MARGIN + TABLE_W, y: top - rowH }, thickness: 0.5, color: GARIS });
    y -= rowH;
  });

  if (rows.length === 0) {
    page!.drawText("Tidak ada data presensi.", { x: MARGIN + PAD, y: y - 16, size: 10, font, color: ABU });
  }

  // Nomor halaman "x / total" setelah jumlah halaman diketahui
  const semuaHalaman = pdf.getPages();
  semuaHalaman.forEach((p, i) => {
    const t = `Halaman ${i + 1} dari ${semuaHalaman.length}`;
    p.drawText(t, {
      x: PAGE_W - MARGIN - font.widthOfTextAtSize(t, 8),
      y: MARGIN - 14,
      size: 8,
      font,
      color: ABU,
    });
  });

  pdf.setTitle(`Daftar Hadir ${judul}`);
  const bytes = await pdf.save();
  const namaFile = `daftar-hadir-${filter.semua ? "semua" : filter.tanggal}.pdf`;
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${namaFile}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

/** Font standar PDF hanya mendukung WinAnsi; karakter di luar itu diganti "?" agar tidak error. */
function aman(teks: string, f: PDFFont) {
  let out = "";
  for (const ch of teks.replace(/\s+/g, " ")) {
    try {
      f.encodeText(ch);
      out += ch;
    } catch {
      out += "?";
    }
  }
  return out;
}

/** Pecah teks per kata sesuai lebar kolom; kata yang terlalu panjang dipotong per karakter. */
function wrap(teks: string, f: PDFFont, lebar: number) {
  const lines: string[] = [];
  let cur = "";
  const muat = (s: string) => f.widthOfTextAtSize(s, FONT_SIZE) <= lebar;
  for (const kata of teks.split(" ")) {
    const coba = cur ? `${cur} ${kata}` : kata;
    if (muat(coba)) {
      cur = coba;
      continue;
    }
    if (cur) lines.push(cur);
    cur = "";
    let sisa = kata;
    while (!muat(sisa)) {
      let n = sisa.length - 1;
      while (n > 1 && !muat(sisa.slice(0, n))) n--;
      lines.push(sisa.slice(0, n));
      sisa = sisa.slice(n);
    }
    cur = sisa;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}
