import type { ReactNode } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";
import type { Skpd } from "@/lib/data";

export const inputClass =
  "block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-ink shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 aria-invalid:border-red-400 aria-invalid:focus:ring-red-500/15 disabled:bg-slate-100";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-sm text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function SkpdSelect({
  skpds,
  error,
  disabled,
}: {
  skpds: Skpd[];
  error?: string;
  disabled?: boolean;
}) {
  return (
    <Field label="SKPD / Unit Kerja" htmlFor="kode_skpd" error={error}>
      <div className="relative">
        <select
          id="kode_skpd"
          name="kode_skpd"
          required
          defaultValue=""
          disabled={disabled}
          aria-invalid={!!error || undefined}
          className={`${inputClass} appearance-none pr-10`}
        >
          <option value="" disabled>
            — Pilih SKPD —
          </option>
          {skpds.map((s) => (
            <option key={s.kode_skpd} value={s.kode_skpd}>
              {s.nama_skpd}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-slate-400" />
      </div>
    </Field>
  );
}

export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-brand-950/5 sm:p-8 ${className}`}
    >
      {children}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <Card>
      <div className="animate-pulse space-y-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <div className="mb-2 h-4 w-28 rounded bg-slate-200" />
            <div className="h-12 rounded-xl bg-slate-100" />
          </div>
        ))}
        <div className="h-12 rounded-xl bg-brand-100" />
      </div>
    </Card>
  );
}
