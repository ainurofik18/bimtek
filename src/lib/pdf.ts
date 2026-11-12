import type { PDFFont } from "pdf-lib";

/** Font standar PDF hanya mendukung WinAnsi; karakter di luar itu diganti "?" agar tidak error. */
export function aman(teks: string, f: PDFFont) {
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

/** Pecah teks per kata sesuai lebar; kata yang terlalu panjang dipotong per karakter. */
export function wrap(teks: string, f: PDFFont, size: number, lebar: number) {
  const lines: string[] = [];
  let cur = "";
  const muat = (s: string) => f.widthOfTextAtSize(s, size) <= lebar;
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
