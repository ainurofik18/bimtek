// Informasi kegiatan yang tampil di halaman. Kosongkan field opsional agar tidak ditampilkan.
export const ACARA = {
  judul: "Bimbingan Teknis Laporan Keuangan Daerah",
  tahun: "2026",
  penyelenggara: "Badan Pengelolaan Keuangan Daerah",
  penyelenggaraSingkat: "BPKD",
  daerah: "Kabupaten Pekalongan",
  /** contoh: "Selasa–Rabu, 27–28 Oktober 2026" */
  tanggal: "",
  /** contoh: "Aula Lantai 3, Setda Kabupaten Pekalongan" */
  tempat: "",
};

// Isi sertifikat peserta (/dashboard/sertifikat).
export const SERTIFIKAT = {
  judul: "Bimbingan Teknis Pengelolaan Keuangan Daerah",
  /** Tanggal pelaksanaan yang tercetak di sertifikat */
  tanggalPelaksanaan: "11 November 2026",
  // Nomor sertifikat (sama untuk semua peserta) diisi lewat .env: SERTIFIKAT_NOMOR
  /** Kota tempat penandatanganan */
  kotaTtd: "Kajen",
  /** Penandatangan sertifikat */
  pejabat: {
    jabatan: "Kepala Badan Pengelolaan Keuangan Daerah",
    nama: "EDY HERIJANTO, S.Sos, M.A.P",
    pangkat: "Pembina Utama Muda",
    nip: "197012311991011004",
  },
  /** Daftar materi (halaman 2). Total JP dihitung otomatis. */
  materi: [
    { judul: "Analisis Standar Belanja", jp: 2 },
    { judul: "Persiapan Penyusunan Laporan Keuangan SKPD melalui SIPD AKLAP", jp: 2 },
    { judul: "Penyusunan CaLK melalui SiCaLK", jp: 2 },
  ],
};
