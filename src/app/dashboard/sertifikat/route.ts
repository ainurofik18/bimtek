import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { ACARA, SERTIFIKAT } from "@/lib/acara";
import { sudahLogin } from "@/lib/auth";
import { aman, wrap } from "@/lib/pdf";
import { ambilPesertaUnik } from "@/lib/presensi";

// A4 landscape, satuan poin
const W = 841.89;
const H = 595.28;

const HIJAU = rgb(0.04, 0.29, 0.24);
const EMAS = rgb(0.77, 0.58, 0.13);
const HITAM = rgb(0.12, 0.12, 0.12);
const ABU = rgb(0.4, 0.4, 0.4);

const PENYELENGGARA = `${ACARA.penyelenggara} ${ACARA.daerah}`;
const TOTAL_JP = SERTIFIKAT.materi.reduce((a, m) => a + m.jp, 0);
const ANGKA = ["nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh"];

export async function GET(req: Request) {
  if (!(await sudahLogin())) return new Response("Unauthorized", { status: 401 });

  // ?nip=... untuk satu peserta; tanpa parameter = seluruh peserta yang presensi.
  const nip = (new URL(req.url).searchParams.get("nip") ?? "").replace(/\D/g, "");
  const semua = await ambilPesertaUnik();
  const peserta = nip ? semua.filter((p) => p.nip === nip) : semua;
  if (peserta.length === 0) return new Response("Peserta tidak ditemukan", { status: 404 });

  const pdf = await PDFDocument.create();
  const f = {
    reg: await pdf.embedFont(StandardFonts.TimesRoman),
    bold: await pdf.embedFont(StandardFonts.TimesRomanBold),
    ital: await pdf.embedFont(StandardFonts.TimesRomanItalic),
  };
  const logoPath = path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "logo-kabupaten-pekalongan.png");
  const logo = await readFile(logoPath)
    .then((b) => pdf.embedPng(b))
    .catch(() => null);

  for (const p of peserta) {
    const nomor = SERTIFIKAT.formatNomor.replace("{no}", String(p.no).padStart(3, "0"));
    halamanDepan(pdf.addPage([W, H]), f, logo, p.nama, p.nip, nomor);
    halamanMateri(pdf.addPage([W, H]), f, logo, nomor);
  }

  pdf.setTitle(nip ? `Sertifikat ${peserta[0].nama}` : "Sertifikat Peserta Bimtek");
  const bytes = await pdf.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="sertifikat-${nip || "semua-peserta"}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

type Fonts = { reg: PDFFont; bold: PDFFont; ital: PDFFont };
type Logo = Awaited<ReturnType<PDFDocument["embedPng"]>> | null;

function tengah(page: PDFPage, teks: string, y: number, font: PDFFont, size: number, color = HITAM, cx = W / 2) {
  const t = aman(teks, font);
  page.drawText(t, { x: cx - font.widthOfTextAtSize(t, size) / 2, y, size, font, color });
}

function bingkai(page: PDFPage) {
  page.drawRectangle({ x: 18, y: 18, width: W - 36, height: H - 36, borderColor: HIJAU, borderWidth: 3 });
  page.drawRectangle({ x: 26, y: 26, width: W - 52, height: H - 52, borderColor: EMAS, borderWidth: 1 });
}

function kepala(page: PDFPage, f: Fonts, logo: Logo, yAtas: number) {
  // Logo kiri-atas kop, nama penyelenggara di tengah
  if (logo) {
    const h = 62;
    const w = (logo.width / logo.height) * h;
    page.drawImage(logo, { x: W / 2 - w / 2, y: yAtas - h, width: w, height: h });
  }
  tengah(page, "PEMERINTAH KABUPATEN PEKALONGAN", yAtas - 78, f.bold, 12, HIJAU);
  tengah(page, ACARA.penyelenggara.toUpperCase(), yAtas - 93, f.bold, 15, HIJAU);
}

function halamanDepan(page: PDFPage, f: Fonts, logo: Logo, nama: string, nip: string, nomor: string) {
  bingkai(page);
  kepala(page, f, logo, H - 44);

  tengah(page, "SERTIFIKAT", H - 182, f.bold, 40, HIJAU);
  tengah(page, `Nomor: ${nomor}`, H - 203, f.reg, 12, ABU);

  tengah(page, "Diberikan kepada:", H - 236, f.ital, 13);

  // Nama + gelar sesuai presensi; ukuran font mengecil bila terlalu panjang
  const namaAman = aman(nama, f.bold);
  let size = 30;
  while (size > 14 && f.bold.widthOfTextAtSize(namaAman, size) > W - 160) size--;
  tengah(page, namaAman, H - 272, f.bold, size);
  page.drawLine({ start: { x: 150, y: H - 280 }, end: { x: W - 150, y: H - 280 }, thickness: 0.8, color: EMAS });
  tengah(page, `NIP. ${nip}`, H - 298, f.reg, 13);

  tengah(page, "telah mengikuti kegiatan", H - 326, f.ital, 13);
  tengah(page, SERTIFIKAT.judul.toUpperCase(), H - 351, f.bold, 19, HIJAU);

  const jpTeks = `${TOTAL_JP} (${ANGKA[TOTAL_JP] ?? TOTAL_JP}) Jam Pelajaran (JP)`;
  // Dua kalimat dipisah manual agar tanggal tidak terpotong di akhir baris.
  [
    `yang diselenggarakan oleh ${PENYELENGGARA}`,
    `pada tanggal ${SERTIFIKAT.tanggalPelaksanaan} dengan durasi ${jpTeks}.`,
  ].forEach((ln, i) => tengah(page, ln, H - 375 - i * 18, f.reg, 13));

  // Blok tanda tangan (kanan bawah)
  const cx = W - 200;
  const { jabatan, nama: namaPejabat, nip: nipPejabat } = SERTIFIKAT.pejabat;
  tengah(page, `${SERTIFIKAT.kotaTtd}, ${SERTIFIKAT.tanggalPelaksanaan}`, 138, f.reg, 12, HITAM, cx);
  wrap(aman(jabatan, f.reg), f.reg, 12, 230).forEach((ln, i) => tengah(page, ln, 123 - i * 14, f.reg, 12, HITAM, cx));
  if (namaPejabat) {
    tengah(page, namaPejabat, 58, f.bold, 12, HITAM, cx);
    const lebar = f.bold.widthOfTextAtSize(aman(namaPejabat, f.bold), 12);
    page.drawLine({ start: { x: cx - lebar / 2, y: 55 }, end: { x: cx + lebar / 2, y: 55 }, thickness: 0.6, color: HITAM });
    if (nipPejabat) tengah(page, `NIP. ${nipPejabat}`, 43, f.reg, 11, HITAM, cx);
  }
}

function halamanMateri(page: PDFPage, f: Fonts, logo: Logo, nomor: string) {
  bingkai(page);
  kepala(page, f, logo, H - 44);

  tengah(page, "DAFTAR MATERI", H - 184, f.bold, 22, HIJAU);
  tengah(page, SERTIFIKAT.judul, H - 205, f.ital, 13);
  tengah(page, `${SERTIFIKAT.tanggalPelaksanaan}  |  Nomor sertifikat: ${nomor}`, H - 222, f.reg, 11, ABU);

  // Tabel materi
  const kolom = { no: 40, materi: 440, jp: 120 };
  const lebar = kolom.no + kolom.materi + kolom.jp;
  const x0 = (W - lebar) / 2;
  const pad = 7;
  const LH = 16;
  let y = H - 250;

  const sel = (x: number, w: number, h: number, bg?: ReturnType<typeof rgb>) =>
    page.drawRectangle({ x, y: y - h, width: w, height: h, borderColor: HIJAU, borderWidth: 0.7, color: bg });

  const header = 26;
  sel(x0, kolom.no, header, rgb(0.9, 0.94, 0.92));
  sel(x0 + kolom.no, kolom.materi, header, rgb(0.9, 0.94, 0.92));
  sel(x0 + kolom.no + kolom.materi, kolom.jp, header, rgb(0.9, 0.94, 0.92));
  tengah(page, "No", y - 17, f.bold, 12, HITAM, x0 + kolom.no / 2);
  tengah(page, "Materi", y - 17, f.bold, 12, HITAM, x0 + kolom.no + kolom.materi / 2);
  tengah(page, "Alokasi Waktu", y - 17, f.bold, 12, HITAM, x0 + kolom.no + kolom.materi + kolom.jp / 2);
  y -= header;

  SERTIFIKAT.materi.forEach((m, i) => {
    const baris = wrap(aman(m.judul, f.reg), f.reg, 12, kolom.materi - pad * 2);
    const h = Math.max(30, baris.length * LH + pad * 2);
    sel(x0, kolom.no, h);
    sel(x0 + kolom.no, kolom.materi, h);
    sel(x0 + kolom.no + kolom.materi, kolom.jp, h);
    tengah(page, String(i + 1), y - h / 2 - 4, f.reg, 12, HITAM, x0 + kolom.no / 2);
    baris.forEach((ln, k) =>
      page.drawText(ln, { x: x0 + kolom.no + pad, y: y - pad - 11 - k * LH, size: 12, font: f.reg, color: HITAM }),
    );
    tengah(page, `${m.jp} JP`, y - h / 2 - 4, f.reg, 12, HITAM, x0 + kolom.no + kolom.materi + kolom.jp / 2);
    y -= h;
  });

  // Baris jumlah
  const hTotal = 28;
  const abu = rgb(0.96, 0.97, 0.96);
  sel(x0, kolom.no + kolom.materi, hTotal, abu);
  sel(x0 + kolom.no + kolom.materi, kolom.jp, hTotal, abu);
  page.drawText("Jumlah", { x: x0 + kolom.no + kolom.materi - pad - f.bold.widthOfTextAtSize("Jumlah", 12), y: y - 18, size: 12, font: f.bold, color: HITAM });
  tengah(page, `${TOTAL_JP} JP`, y - 18, f.bold, 12, HITAM, x0 + kolom.no + kolom.materi + kolom.jp / 2);
}
