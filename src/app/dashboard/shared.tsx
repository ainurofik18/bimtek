import Link from "next/link";
import { Card, inputClass } from "@/components/form";
import { login } from "./actions";

export const DASHBOARD_TABS = [
  { href: "/dashboard", label: "Presensi" },
  { href: "/dashboard/post-test", label: "Hasil Post Test" },
] as const;

/** Form masuk dengan API key; `next` = halaman dashboard tujuan setelah berhasil login. */
export function LoginCard({ next, salah }: { next: string; salah?: boolean }) {
  return (
    <Card className="mx-auto max-w-md">
      <form action={login} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <label htmlFor="key" className="block text-sm font-semibold text-slate-700">
          API Key
        </label>
        <input id="key" name="key" type="password" required autoFocus className={inputClass} />
        {salah && <p className="text-sm text-red-600">API key salah.</p>}
        <button className="w-full rounded-xl bg-brand-700 px-5 py-3 font-bold text-white transition hover:bg-brand-800">
          Masuk
        </button>
      </form>
    </Card>
  );
}

export function DashboardTabs({ aktif }: { aktif: (typeof DASHBOARD_TABS)[number]["href"] }) {
  return (
    <nav aria-label="Menu dashboard" className="flex gap-1 border-b border-slate-200">
      {DASHBOARD_TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.href === aktif ? "page" : undefined}
          className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            t.href === aktif
              ? "border-brand-700 text-brand-700"
              : "border-transparent text-slate-500 hover:text-ink"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
