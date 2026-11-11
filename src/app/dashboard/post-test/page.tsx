import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import type { RowDataPacket } from "mysql2";
import { LogOut, Search } from "lucide-react";
import { Card, FormSkeleton, inputClass } from "@/components/form";
import { PageHero, SiteFooter } from "@/components/site-chrome";
import { sudahLogin } from "@/lib/auth";
import { db } from "@/lib/db";
import { logout } from "../actions";
import { DashboardTabs, LoginCard } from "../shared";

export const metadata: Metadata = {
  title: "Dashboard Hasil Post Test",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ tanggal?: string; q?: string; status?: string; salah?: string }>;

type Status = "semua" | "sudah" | "belum";

type Peserta = {
  nip: string;
  nama: string;
  skpd: string;
  mulaiHadir: string;
  // null = belum mengisi post test
  hasil: {
    jumlahSoal: number;
    jumlahBenar: number;
    nilai: number;
    saran: string;
    waktu: string;
  } | null;
};

export default function DashboardPostTestPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHero
        eyebrow="Panitia"
        title="Hasil Post Test"
        description="Nilai post test dan saran dari peserta bimbingan teknis yang hadir."
      />
      <main className="relative mx-auto -mt-20 w-full max-w-6xl px-4 pb-16 sm:px-6">
        <Suspense fallback={<FormSkeleton />}>
          <Dashboard searchParams={searchParams} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function Dashboard({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const sp = await searchParams;

  if (!(await sudahLogin())) {
    return <LoginCard next="/dashboard/post-test" salah={!!sp.salah} />;
  }

  // Filter tanggal = tanggal PRESENSI. Kosong = semua tanggal.
  const tanggal = /^\d{4}-\d{2}-\d{2}$/.test(sp.tanggal ?? "") ? sp.tanggal! : "";
  const q = (sp.q ?? "").trim().slice(0, 100);
  const status: Status = sp.status === "sudah" || sp.status === "belum" ? sp.status : "semua";

  // Satu baris per NIP yang pernah presensi (peserta bisa hadir di beberapa hari),
  // dipasangkan dengan hasil post test-nya bila sudah mengisi.
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT h.nip, h.nama, h.mulai_hadir, COALESCE(s.nama_skpd, h.kode_skpd) AS skpd,
            t.id AS test_id, t.jumlah_soal, t.jumlah_benar, t.nilai, t.saran, t.created_at AS waktu
       FROM (
         SELECT nip, MAX(nama) AS nama, MAX(kode_skpd) AS kode_skpd, MIN(tanggal) AS mulai_hadir
           FROM presensis
          ${tanggal ? "WHERE tanggal = ?" : ""}
          GROUP BY nip
       ) h
       LEFT JOIN post_tests t ON t.nip = h.nip
       LEFT JOIN master_skpds s ON s.kode_skpd = h.kode_skpd
      ORDER BY t.id IS NULL, t.nilai DESC, h.nama`,
    tanggal ? [tanggal] : [],
  );

  const semuaPeserta: Peserta[] = rows.map((r) => ({
    nip: r.nip,
    nama: r.nama,
    skpd: r.skpd,
    mulaiHadir: r.mulai_hadir,
    hasil:
      r.test_id == null
        ? null
        : {
            jumlahSoal: Number(r.jumlah_soal),
            jumlahBenar: Number(r.jumlah_benar),
            nilai: Number(r.nilai),
            saran: r.saran,
            waktu: String(r.waktu),
          },
  }));

  // Ringkasan dihitung dari seluruh peserta hadir (sebelum filter cari/status).
  const sudah = semuaPeserta.filter((p) => p.hasil);
  const nilaiList = sudah.map((p) => p.hasil!.nilai);
  const rata = nilaiList.length ? nilaiList.reduce((a, b) => a + b, 0) / nilaiList.length : null;
  const tertinggi = nilaiList.length ? Math.max(...nilaiList) : null;
  const terendah = nilaiList.length ? Math.min(...nilaiList) : null;

  const qLower = q.toLowerCase();
  const tampil = semuaPeserta.filter((p) => {
    if (status === "sudah" && !p.hasil) return false;
    if (status === "belum" && p.hasil) return false;
    if (qLower && !p.nama.toLowerCase().includes(qLower) && !p.nip.includes(qLower)) return false;
    return true;
  });

  return (
    <Card className="space-y-6">
      <DashboardTabs aktif="/dashboard/post-test" />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <form className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="tanggal" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Tanggal presensi
            </label>
            <input id="tanggal" name="tanggal" type="date" defaultValue={tanggal} className={inputClass} />
          </div>
          <div>
            <label htmlFor="status" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Status
            </label>
            <select id="status" name="status" defaultValue={status} className={inputClass}>
              <option value="semua">Semua peserta hadir</option>
              <option value="sudah">Sudah post test</option>
              <option value="belum">Belum post test</option>
            </select>
          </div>
          <div>
            <label htmlFor="q" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Cari nama / NIP
            </label>
            <input id="q" name="q" defaultValue={q} className={inputClass} />
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white transition hover:bg-brand-800">
            <Search className="size-4" /> Tampilkan
          </button>
          <a href="/dashboard/post-test" className="py-3 text-sm font-semibold text-brand-700 hover:underline">
            Reset
          </a>
        </form>
        <form action={logout}>
          <input type="hidden" name="next" value="/dashboard/post-test" />
          <button className="inline-flex items-center gap-2 py-3 text-sm font-semibold text-slate-500 hover:text-ink">
            <LogOut className="size-4" /> Keluar
          </button>
        </form>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Peserta hadir" nilai={semuaPeserta.length} />
        <Stat label="Sudah post test" nilai={sudah.length} sub={persen(sudah.length, semuaPeserta.length)} />
        <Stat label="Rata-rata nilai" nilai={rata == null ? "–" : fmt(rata)} />
        <Stat label="Nilai tertinggi" nilai={tertinggi == null ? "–" : fmt(tertinggi)} />
        <Stat label="Nilai terendah" nilai={terendah == null ? "–" : fmt(terendah)} />
      </dl>

      <p className="text-slate-600">
        Menampilkan <strong className="text-ink tabular-nums">{tampil.length}</strong> peserta
        {tanggal ? ` yang hadir pada ${tanggal}` : " yang hadir (semua tanggal)"}.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="py-2 pr-4">No</th>
              <th className="py-2 pr-4">Nama</th>
              <th className="py-2 pr-4">NIP</th>
              <th className="py-2 pr-4">SKPD</th>
              <th className="py-2 pr-4 text-right">Benar</th>
              <th className="py-2 pr-4 text-right">Nilai</th>
              <th className="py-2 pr-4">Waktu</th>
              <th className="py-2">Saran</th>
            </tr>
          </thead>
          <tbody>
            {tampil.map((p, i) => (
              <tr key={p.nip} className="border-b border-slate-100 align-top">
                <td className="py-2.5 pr-4 tabular-nums">{i + 1}</td>
                <td className="py-2.5 pr-4 font-semibold text-ink">{p.nama}</td>
                <td className="py-2.5 pr-4 tabular-nums">{p.nip}</td>
                <td className="py-2.5 pr-4">{p.skpd}</td>
                {p.hasil ? (
                  <>
                    <td className="py-2.5 pr-4 text-right whitespace-nowrap tabular-nums">
                      {p.hasil.jumlahBenar} / {p.hasil.jumlahSoal}
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      <span
                        className={`inline-block min-w-14 rounded-lg px-2 py-0.5 text-center font-bold tabular-nums ${warnaNilai(p.hasil.nilai)}`}
                      >
                        {fmt(p.hasil.nilai)}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 whitespace-nowrap tabular-nums">
                      {p.hasil.waktu.slice(0, 16)}
                    </td>
                    <td className="max-w-xs py-2.5">
                      <details>
                        <summary className="cursor-pointer font-semibold text-brand-700 hover:underline">
                          Lihat
                        </summary>
                        <p className="mt-1.5 whitespace-pre-wrap text-slate-600">{p.hasil.saran}</p>
                      </details>
                    </td>
                  </>
                ) : (
                  <td colSpan={4} className="py-2.5 text-slate-400 italic">
                    Belum mengisi post test
                  </td>
                )}
              </tr>
            ))}
            {tampil.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-500">
                  Tidak ada data yang cocok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Stat({ label, nilai, sub }: { label: string; nilai: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
      <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className="mt-1 text-2xl font-extrabold text-ink tabular-nums">
        {nilai}
        {sub && <span className="ml-2 text-sm font-semibold text-slate-500">{sub}</span>}
      </dd>
    </div>
  );
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, ""));
const persen = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "");

function warnaNilai(n: number) {
  if (n >= 80) return "bg-emerald-50 text-emerald-700";
  if (n >= 60) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}
