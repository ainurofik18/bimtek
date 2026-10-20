export function bersihkanNama(v: unknown) {
  return String(v ?? "").replace(/\s+/g, " ").trim();
}

export function validasiNama(nama: string) {
  if (nama.length < 3) return "Nama minimal 3 karakter.";
  if (nama.length > 150) return "Nama maksimal 150 karakter.";
  return null;
}

export function bersihkanNip(v: unknown) {
  return String(v ?? "").replace(/\D/g, "");
}

export function validasiNip(nip: string) {
  if (!/^\d{18}$/.test(nip)) return "NIP harus 18 digit angka.";
  return null;
}

/** Normalisasi ke format 08xxxxxxxxxx. */
export function bersihkanNoHp(v: unknown) {
  let hp = String(v ?? "").replace(/\D/g, "");
  if (hp.startsWith("62")) hp = "0" + hp.slice(2);
  return hp;
}

export function validasiNoHp(hp: string) {
  if (!/^08\d{8,11}$/.test(hp)) return "Nomor HP tidak valid (contoh: 081234567890).";
  return null;
}

/** Tanggal hari ini (WIB) dalam format YYYY-MM-DD. */
export function tanggalWib(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
