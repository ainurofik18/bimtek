-- Skema database Presensi & Post Test
-- Bimbingan Teknis Laporan Keuangan Daerah Tahun 2026 - BPKD Kabupaten Pekalongan
--
-- Jalankan:  mysql -uroot bimtek < database/schema.sql
-- Tabel master_skpds diasumsikan sudah ada.

SET NAMES utf8mb4;

-- ------------------------------------------------------------------
-- Presensi peserta (satu NIP hanya boleh presensi satu kali per hari)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `presensis` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nama`        VARCHAR(150) NOT NULL,
  `nip`         VARCHAR(18)  NOT NULL,
  `kode_skpd`   VARCHAR(255) NOT NULL,
  `no_hp`       VARCHAR(20)  NOT NULL,
  `foto`        VARCHAR(255) NOT NULL COMMENT 'Path relatif terhadap STORAGE_DIR',
  `tanggal`     DATE         NOT NULL COMMENT 'Tanggal presensi (WIB)',
  `ip_address`  VARCHAR(45)  NULL,
  `user_agent`  VARCHAR(255) NULL,
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_presensis_nip_tanggal` (`nip`, `tanggal`),
  KEY `idx_presensis_kode_skpd` (`kode_skpd`),
  CONSTRAINT `fk_presensis_skpd` FOREIGN KEY (`kode_skpd`)
    REFERENCES `master_skpds` (`kode_skpd`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------
-- Bank soal post test (diisi manual)
--   kunci_jawaban : 'A' | 'B' | 'C' | 'D' | 'E'
--   pilihan_e     : boleh NULL jika soal hanya punya 4 pilihan
--   urutan        : urutan tampil soal
--   aktif         : 1 = ditampilkan, 0 = disembunyikan
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `soal_post_tests` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `urutan`         INT UNSIGNED NOT NULL DEFAULT 0,
  `pertanyaan`     TEXT NOT NULL,
  `pilihan_a`      TEXT NOT NULL,
  `pilihan_b`      TEXT NOT NULL,
  `pilihan_c`      TEXT NOT NULL,
  `pilihan_d`      TEXT NOT NULL,
  `pilihan_e`      TEXT NULL,
  `kunci_jawaban`  ENUM('A','B','C','D','E') NOT NULL,
  `aktif`          TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_soal_aktif_urutan` (`aktif`, `urutan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------
-- Hasil post test + saran/masukan (satu NIP hanya boleh mengisi sekali)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `post_tests` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nama`          VARCHAR(150) NOT NULL,
  `nip`           VARCHAR(18)  NOT NULL,
  `kode_skpd`     VARCHAR(255) NOT NULL,
  `jumlah_soal`   SMALLINT UNSIGNED NOT NULL,
  `jumlah_benar`  SMALLINT UNSIGNED NOT NULL,
  `nilai`         DECIMAL(5,2) NOT NULL,
  `saran`         TEXT NOT NULL COMMENT 'Saran/masukan untuk bimtek selanjutnya',
  `ip_address`    VARCHAR(45)  NULL,
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_post_tests_nip` (`nip`),
  KEY `idx_post_tests_kode_skpd` (`kode_skpd`),
  CONSTRAINT `fk_post_tests_skpd` FOREIGN KEY (`kode_skpd`)
    REFERENCES `master_skpds` (`kode_skpd`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rincian jawaban per soal
CREATE TABLE IF NOT EXISTS `post_test_jawabans` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `post_test_id`  BIGINT UNSIGNED NOT NULL,
  `soal_id`       INT UNSIGNED NOT NULL,
  `jawaban`       ENUM('A','B','C','D','E') NOT NULL,
  `benar`         TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_jawaban_post_test_soal` (`post_test_id`, `soal_id`),
  KEY `idx_jawaban_soal` (`soal_id`),
  CONSTRAINT `fk_jawaban_post_test` FOREIGN KEY (`post_test_id`)
    REFERENCES `post_tests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_jawaban_soal` FOREIGN KEY (`soal_id`)
    REFERENCES `soal_post_tests` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------
-- Contoh pengisian soal (hapus komentar & sesuaikan):
-- INSERT INTO soal_post_tests
--   (urutan, pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, pilihan_e, kunci_jawaban)
-- VALUES
--   (1, 'Teks pertanyaan nomor 1?', 'Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D', NULL, 'B');
-- ------------------------------------------------------------------
