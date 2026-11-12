import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { Camera, FileDown, LogOut, Search } from "lucide-react";
import { Card, FormSkeleton, inputClass } from "@/components/form";
import { PageHero, SiteFooter } from "@/components/site-chrome";
import { sudahLogin } from "@/lib/auth";
import { ambilPresensi, parseFilterPresensi } from "@/lib/presensi";
import { logout } from "./actions";
import { DashboardTabs, LoginCard } from "./shared";

export const metadata: Metadata = {
  title: "Dashboard Presensi",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ tanggal?: string; q?: string; salah?: string }>;

export default function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHero
        eyebrow="Panitia"
        title="Dashboard Presensi"
        description="Daftar hadir peserta bimbingan teknis."
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
    return <LoginCard next="/dashboard" salah={!!sp.salah} />;
  }

  const filter = parseFilterPresensi(sp);
  const { semua, tanggal, q } = filter;
  const rows = await ambilPresensi(filter);
  const pdfHref = `/dashboard/laporan?${new URLSearchParams({ tanggal: semua ? "semua" : tanggal, q })}`;

  return (
    <Card className="space-y-5">
      <DashboardTabs aktif="/dashboard" />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <form className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="tanggal" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Tanggal
            </label>
            <input
              id="tanggal"
              name="tanggal"
              type="date"
              defaultValue={semua ? "" : tanggal}
              className={inputClass}
            />
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
          <a href="/dashboard?tanggal=semua" className="py-3 text-sm font-semibold text-brand-700 hover:underline">
            Semua tanggal
          </a>
        </form>
        <form action={logout}>
          <input type="hidden" name="next" value="/dashboard" />
          <button className="inline-flex items-center gap-2 py-3 text-sm font-semibold text-slate-500 hover:text-ink">
            <LogOut className="size-4" /> Keluar
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-slate-600">
          <strong className="text-2xl text-ink tabular-nums">{rows.length}</strong> peserta hadir
          {semua ? " (semua tanggal)" : ` pada ${tanggal}`}
        </p>
        {rows.length > 0 && (
          <a
            href={pdfHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-brand-700 px-4 py-2.5 text-sm font-bold text-brand-700 transition hover:bg-brand-50"
          >
            <FileDown className="size-4" /> Cetak PDF
          </a>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="py-2 pr-4">No</th>
              <th className="py-2 pr-4">Nama</th>
              <th className="py-2 pr-4">NIP</th>
              <th className="py-2 pr-4">SKPD</th>
              <th className="py-2 pr-4">No. HP</th>
              <th className="py-2 pr-4">Waktu</th>
              <th className="py-2">Foto</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-b border-slate-100 align-top">
                <td className="py-2.5 pr-4 tabular-nums">{i + 1}</td>
                <td className="py-2.5 pr-4 font-semibold text-ink">{r.nama}</td>
                <td className="py-2.5 pr-4 tabular-nums">{r.nip}</td>
                <td className="py-2.5 pr-4">{r.skpd}</td>
                <td className="py-2.5 pr-4 tabular-nums">{r.no_hp}</td>
                <td className="py-2.5 pr-4 whitespace-nowrap tabular-nums">
                  {semua && `${r.tanggal} `}
                  {String(r.created_at).slice(11, 16)}
                </td>
                <td className="py-2.5">
                  <a
                    href={`/dashboard/foto/${r.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline"
                  >
                    <Camera className="size-4" /> Lihat
                  </a>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-500">
                  Belum ada data presensi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
