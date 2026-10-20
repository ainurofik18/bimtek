# Presensi Bimtek Laporan Keuangan Daerah 2026

Aplikasi presensi, post test, dan saran/masukan Bimbingan Teknis Laporan Keuangan Daerah Tahun 2026 —
BPKD Kabupaten Pekalongan. Next.js 16 (App Router) + MySQL.

| Halaman      | Isi                                                             |
| ------------ | --------------------------------------------------------------- |
| `/`          | Landing page + link presensi, post test, dan unduh materi       |
| `/presensi`  | Form nama, NIP, SKPD (`master_skpds`), no HP, foto selfie kamera |
| `/post-test` | Soal pilihan ganda dari `soal_post_tests` + saran/masukan       |

## Database

```bash
mysql -uroot bimtek < database/schema.sql
```

Tabel yang dibuat: `presensis`, `soal_post_tests`, `post_tests`, `post_test_jawabans`.

Mengisi soal (kunci jawaban hanya dibaca di server, tidak pernah dikirim ke browser):

```sql
INSERT INTO soal_post_tests
  (urutan, pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, pilihan_e, kunci_jawaban)
VALUES
  (1, 'Pertanyaan nomor 1?', 'Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D', NULL, 'B');
```

- `pilihan_e` boleh `NULL` bila hanya 4 pilihan.
- Semua soal dengan `aktif = 1` ditampilkan, diurutkan berdasarkan `urutan`.
- Selama tabel soal kosong, halaman post test menampilkan "Post test belum dibuka".

Aturan duplikasi: presensi 1× per NIP per hari; post test 1× per NIP.

## Konfigurasi

Salin `.env.example` menjadi `.env.local` (dev) atau `.env.production.local` (server):

- `DB_*` — koneksi MySQL.
- `STORAGE_DIR` — folder foto selfie (default `./storage`). Foto disimpan di
  `<STORAGE_DIR>/presensi/<tanggal>/<nip>-....jpg`, path relatifnya di kolom `presensis.foto`.
- `MATERI_URL` — link Google Drive materi. Dibaca saat runtime: cukup ubah lalu restart, tanpa build ulang.

Tanggal & tempat kegiatan dapat diisi di [src/lib/acara.ts](src/lib/acara.ts) (perlu build ulang).

## Menjalankan

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start   # produksi (port 3000, ganti dengan -p)
```

## Deploy ke bimtek.elkpd.id

1. **Wajib HTTPS.** Browser hanya mengizinkan akses kamera pada halaman HTTPS.
   Tanpa HTTPS, peserta hanya bisa memakai tombol cadangan "Unggah foto dari kamera perangkat".
2. Jalankan dengan process manager, misalnya `pm2 start npm --name bimtek -- start`.
3. Reverse proxy (Nginx) ke port aplikasi, teruskan header host:
   ```nginx
   client_max_body_size 5m;
   location / {
     proxy_pass http://127.0.0.1:3000;
     proxy_set_header Host $host;
     proxy_set_header X-Forwarded-Host $host;
     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
     proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```
4. Pastikan folder `STORAGE_DIR` dapat ditulis oleh user yang menjalankan aplikasi, dan ikut dibackup.
