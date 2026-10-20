import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpenCheck,
  CalendarDays,
  Camera,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  Landmark,
  MapPin,
  Scale,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Brand, SiteFooter } from "@/components/site-chrome";
import { ACARA } from "@/lib/acara";

const KOMPONEN_LK: { nama: string; icon: LucideIcon }[] = [
  { nama: "Laporan Realisasi Anggaran", icon: TrendingUp },
  { nama: "Neraca", icon: Scale },
  { nama: "Laporan Operasional", icon: FileSpreadsheet },
  { nama: "Laporan Arus Kas", icon: Wallet },
  { nama: "Catatan atas Laporan Keuangan", icon: BookOpenCheck },
];

export default function Home() {
  return (
    <>
      <Hero />
      <main className="relative z-10 mx-auto -mt-16 w-full max-w-6xl px-4 sm:px-6">
        <section aria-labelledby="layanan" className="grid gap-5 md:grid-cols-3">
          <h2 id="layanan" className="sr-only">
            Layanan Peserta
          </h2>
          <LayananCard
            no="01"
            href="/presensi"
            icon={Camera}
            judul="Presensi Peserta"
            deskripsi="Isi daftar hadir dengan data diri dan foto selfie sebagai bukti kehadiran."
            aksi="Isi Presensi"
          />
          <LayananCard
            no="02"
            href="/post-test"
            icon={ClipboardCheck}
            judul="Post Test & Saran"
            deskripsi="Kerjakan 10 soal evaluasi dan sampaikan masukan untuk bimtek berikutnya."
            aksi="Mulai Post Test"
          />
          <Suspense fallback={<MateriCardView url={null} />}>
            <MateriCard />
          </Suspense>
        </section>

        <Alur />
      </main>
      <SiteFooter />
    </>
  );
}

function Hero() {
  return (
    <header className="relative overflow-hidden bg-brand-950 pb-32 text-white">
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div className="absolute -top-40 -left-32 size-[32rem] rounded-full bg-brand-500/25 blur-3xl" aria-hidden />
      <div className="absolute top-20 -right-24 size-[28rem] rounded-full bg-gold-400/20 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <nav className="flex items-center justify-between py-5">
          <Brand />
          <div className="hidden items-center gap-1 text-sm md:flex">
            <Link href="/presensi" className="rounded-full px-4 py-2 text-brand-100/80 transition hover:bg-white/10 hover:text-white">
              Presensi
            </Link>
            <Link href="/post-test" className="rounded-full px-4 py-2 text-brand-100/80 transition hover:bg-white/10 hover:text-white">
              Post Test
            </Link>
            <a href="#materi" className="rounded-full px-4 py-2 text-brand-100/80 transition hover:bg-white/10 hover:text-white">
              Materi
            </a>
          </div>
        </nav>

        <div className="grid items-center gap-12 pt-10 pb-6 lg:grid-cols-[1.15fr_1fr] lg:pt-16">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-300/30 bg-gold-300/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-gold-200">
              <Landmark className="size-3.5" />
              {ACARA.penyelenggara} {ACARA.daerah}
            </span>
            <h1 className="mt-6 text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Bimbingan Teknis
              <span className="text-gradient-gold block pb-1">Laporan Keuangan Daerah</span>
              <span className="block text-brand-100/90">Tahun {ACARA.tahun}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-brand-100/75">
              Selamat datang, peserta bimtek. Gunakan halaman ini untuk presensi kehadiran, mengerjakan post
              test, menyampaikan saran, dan mengunduh materi kegiatan.
            </p>

            {(ACARA.tanggal || ACARA.tempat) && (
              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                {ACARA.tanggal && (
                  <span className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3.5 py-2 ring-1 ring-white/10">
                    <CalendarDays className="size-4 text-gold-300" /> {ACARA.tanggal}
                  </span>
                )}
                {ACARA.tempat && (
                  <span className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3.5 py-2 ring-1 ring-white/10">
                    <MapPin className="size-4 text-gold-300" /> {ACARA.tempat}
                  </span>
                )}
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/presensi"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gold-400 px-6 py-3.5 font-bold text-brand-950 shadow-xl shadow-gold-500/25 transition hover:bg-gold-300"
              >
                <Camera className="size-5" /> Presensi Sekarang
                <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/post-test"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-6 py-3.5 font-semibold text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/15"
              >
                <ClipboardCheck className="size-5" /> Post Test & Saran
              </Link>
            </div>
          </div>

          <HeroVisual />
        </div>
      </div>
    </header>
  );
}

/** Ilustrasi kartu "laporan keuangan" bernuansa dashboard. */
function HeroVisual() {
  const batang = [38, 52, 46, 64, 58, 76, 70, 88];
  return (
    <div className="relative mx-auto hidden w-full max-w-md lg:block" aria-hidden>
      <div className="animate-float rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs tracking-widest text-brand-100/60 uppercase">Laporan Keuangan</p>
            <p className="mt-1 text-lg font-bold">Pemerintah Daerah</p>
          </div>
          <span className="rounded-full bg-brand-400/15 px-3 py-1 text-xs font-semibold text-brand-300">
            TA {ACARA.tahun}
          </span>
        </div>

        <div className="mt-6 flex h-28 items-end gap-2">
          {batang.map((h, i) => (
            <div
              key={i}
              className={`flex-1 rounded-t-md ${i === batang.length - 1 ? "bg-gradient-to-t from-gold-500 to-gold-300" : "bg-gradient-to-t from-brand-700 to-brand-400/80"}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>

        <ul className="mt-6 space-y-2">
          {KOMPONEN_LK.map(({ nama, icon: Icon }) => (
            <li key={nama} className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5 ring-1 ring-white/5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand-400/15 text-brand-300">
                <Icon className="size-4" />
              </span>
              <span className="text-sm text-brand-50/90">{nama}</span>
              <span className="ml-auto size-2 rounded-full bg-brand-400" />
            </li>
          ))}
        </ul>
      </div>

      <div className="absolute -bottom-6 -left-10 rounded-2xl border border-white/10 bg-brand-900/90 px-4 py-3 shadow-xl backdrop-blur">
        <p className="text-xs text-brand-100/60">Opini yang dituju</p>
        <p className="text-gradient-gold text-xl font-extrabold">WTP</p>
      </div>
    </div>
  );
}

function LayananCard({
  no,
  href,
  icon: Icon,
  judul,
  deskripsi,
  aksi,
  external,
  disabled,
}: {
  no: string;
  href: string;
  icon: LucideIcon;
  judul: string;
  deskripsi: string;
  aksi: string;
  external?: boolean;
  disabled?: boolean;
}) {
  const isi = (
    <>
      <div className="flex items-start justify-between">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-950 text-gold-300 shadow-lg shadow-brand-950/20 transition group-hover:scale-105">
          <Icon className="size-6" />
        </span>
        <span className="text-4xl font-extrabold text-slate-100 transition group-hover:text-brand-100">{no}</span>
      </div>
      <h3 className="mt-6 text-xl font-bold text-ink">{judul}</h3>
      <p className="mt-2 flex-1 text-slate-500">{deskripsi}</p>
      <span
        className={`mt-6 inline-flex items-center gap-1.5 text-sm font-bold ${
          disabled ? "text-slate-400" : "text-brand-700 group-hover:gap-2.5"
        } transition-all`}
      >
        {aksi}
        {!disabled && (external ? <ArrowUpRight className="size-4" /> : <ArrowRight className="size-4" />)}
      </span>
    </>
  );

  const kelas =
    "group flex h-full flex-col rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xl shadow-brand-950/5 transition";

  if (disabled) {
    return <div className={`${kelas} cursor-not-allowed`}>{isi}</div>;
  }
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`${kelas} hover:-translate-y-1 hover:shadow-2xl`}>
        {isi}
      </a>
    );
  }
  return (
    <Link href={href} className={`${kelas} hover:-translate-y-1 hover:shadow-2xl`}>
      {isi}
    </Link>
  );
}

/** Link materi dibaca dari env MATERI_URL saat runtime, jadi cukup ubah .env lalu restart. */
async function MateriCard() {
  await connection();
  const url = process.env.MATERI_URL?.trim() || null;
  return <MateriCardView url={url} />;
}

function MateriCardView({ url }: { url: string | null }) {
  return (
    <div id="materi" className="scroll-mt-6">
      <LayananCard
        no="03"
        href={url ?? "#"}
        icon={Download}
        judul="Unduh Materi"
        deskripsi="Bahan paparan narasumber dan dokumen pendukung kegiatan bimbingan teknis."
        aksi={url ? "Buka Google Drive" : "Segera tersedia"}
        external
        disabled={!url}
      />
    </div>
  );
}

function Alur() {
  const langkah = [
    {
      judul: "Presensi saat hadir",
      teks: "Isi nama, NIP, SKPD, nomor HP, lalu ambil foto selfie di lokasi kegiatan.",
    },
    {
      judul: "Ikuti sesi bimtek",
      teks: "Simak paparan narasumber. Materi dapat diunduh melalui halaman ini.",
    },
    {
      judul: "Kerjakan post test",
      teks: "Di akhir kegiatan, jawab 10 soal evaluasi dan tuliskan saran untuk bimtek selanjutnya.",
    },
  ];
  return (
    <section aria-labelledby="alur" className="py-20">
      <div className="text-center">
        <p className="text-sm font-semibold tracking-widest text-brand-600 uppercase">Panduan Peserta</p>
        <h2 id="alur" className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Alur Kegiatan
        </h2>
      </div>
      <ol className="mt-12 grid gap-6 md:grid-cols-3">
        {langkah.map((l, i) => (
          <li key={l.judul} className="relative rounded-3xl bg-gradient-to-b from-brand-50 to-white p-7 ring-1 ring-brand-100">
            <span className="flex size-10 items-center justify-center rounded-full bg-brand-700 font-bold text-white tabular-nums">
              {i + 1}
            </span>
            <h3 className="mt-5 text-lg font-bold text-ink">{l.judul}</h3>
            <p className="mt-2 text-slate-600">{l.teks}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
