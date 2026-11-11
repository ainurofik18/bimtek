import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import type { RowDataPacket } from "mysql2";
import { Camera, LogOut, Search } from "lucide-react";
import { Card, FormSkeleton, inputClass } from "@/components/form";
import { PageHero, SiteFooter } from "@/components/site-chrome";
import { sudahLogin } from "@/lib/auth";
import { db } from "@/lib/db";
import { tanggalWib } from "@/lib/validasi";
import { login, logout } from "./actions";

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
    return (
      <Card className="mx-auto max-w-md">
        <form action={login} className="space-y-4">
          <label htmlFor="key" className="block text-sm font-semibold text-slate-700">
            API Key
          </label>
          <input id="key" name="key" type="password" required autoFocus className={inputClass} />
          {sp.salah && <p className="text-sm text-red-600">API key salah.</p>}
          <button className="w-full rounded-xl bg-brand-700 px-5 py-3 font-bold text-white transition hover:bg-brand-800">
            Masuk
          </button>
        </form>
      </Card>
    );
  }

  const semua = sp.tanggal === "semua";
  const tanggal = /^\d{4}-\d{2}-\d{2}$/.test(sp.tanggal ?? "") ? sp.tanggal! : tanggalWib();
  const q = (sp.q ?? "").trim().slice(0, 100);

  const where: string[] = [];
  const params: string[] = [];
  if (!semua) {
    where.push("p.tanggal = ?");
    params.push(tanggal);
  }
  if (q) {
    where.push("(p.nama LIKE ? OR p.nip LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT p.id, p.nama, p.nip, p.no_hp, p.tanggal, p.created_at, COALESCE(s.nama_skpd, p.kode_skpd) AS skpd
       FROM presensis p
       LEFT JOIN master_skpds s ON s.kode_skpd = p.kode_skpd
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY p.created_at DESC`,
    params,
  );

  return (
    <Card className="space-y-5">
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
          <button className="inline-flex items-center gap-2 py-3 text-sm font-semibold text-slate-500 hover:text-ink">
            <LogOut className="size-4" /> Keluar
          </button>
        </form>
      </div>

      <p className="text-slate-600">
        <strong className="text-2xl text-ink tabular-nums">{rows.length}</strong> peserta hadir
        {semua ? " (semua tanggal)" : ` pada ${tanggal}`}
      </p>

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
