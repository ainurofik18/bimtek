import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ACARA } from "@/lib/acara";

export function LogoMark({ className = "size-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="16" fill="#0a4a3e" />
      <rect x="14" y="34" width="8" height="16" rx="2" fill="#6de4bd" />
      <rect x="28" y="24" width="8" height="26" rx="2" fill="#33cda0" />
      <rect x="42" y="14" width="8" height="36" rx="2" fill="#e5ae35" />
    </svg>
  );
}

export function Brand({ tone = "light" }: { tone?: "light" | "dark" }) {
  const muted = tone === "light" ? "text-brand-100/70" : "text-slate-500";
  const strong = tone === "light" ? "text-white" : "text-ink";
  return (
    <Link href="/" className="flex items-center gap-3">
      <LogoMark className="size-10 shrink-0 ring-1 ring-white/15 rounded-2xl" />
      <span className="leading-tight">
        <span className={`block text-sm font-bold ${strong}`}>
          {ACARA.penyelenggaraSingkat} {ACARA.daerah}
        </span>
        <span className={`block text-xs ${muted}`}>Bimtek LKD {ACARA.tahun}</span>
      </span>
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {ACARA.tahun} {ACARA.penyelenggara} {ACARA.daerah}
        </p>
        <p>
          {ACARA.judul} Tahun {ACARA.tahun}
        </p>
      </div>
    </footer>
  );
}

/** Header berwarna untuk halaman form (presensi / post test). */
export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="relative overflow-hidden bg-brand-950 pb-28 text-white">
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div
        className="absolute -top-24 right-0 size-96 rounded-full bg-gold-400/20 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <div className="flex items-center justify-between py-5">
          <Brand />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-brand-100/80 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="size-4" /> Beranda
          </Link>
        </div>
        <div className="pt-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold-300">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-xl text-brand-100/80">{description}</p>
        </div>
      </div>
    </header>
  );
}
