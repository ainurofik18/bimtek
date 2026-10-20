"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Card, Field, FormAlert, SkpdSelect, inputClass } from "@/components/form";
import { KameraSelfie, type FotoSelfie } from "@/components/kamera-selfie";
import type { Skpd } from "@/lib/data";
import { simpanPresensi, type PresensiState } from "./actions";

export function PresensiForm({ skpds }: { skpds: Skpd[] }) {
  const [state, dispatch, pending] = useActionState<PresensiState, FormData>(simpanPresensi, {
    status: "idle",
  });
  const [foto, setFoto] = useState<FotoSelfie | null>(null);
  const [fotoKosong, setFotoKosong] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!foto) {
      setFotoKosong(true);
      document.getElementById("bagian-foto")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const fd = new FormData(e.currentTarget);
    fd.set("foto", foto.blob, "selfie.jpg");
    startTransition(() => dispatch(fd));
  }

  if (state.status === "success") {
    return (
      <Card className="text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <CheckCircle2 className="size-9" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-ink">Presensi Berhasil</h2>
        <p className="mt-1 text-slate-500">Terima kasih, kehadiran Anda telah tercatat.</p>
        <dl className="mx-auto mt-6 max-w-sm divide-y divide-slate-100 rounded-2xl bg-slate-50 text-left text-sm">
          {[
            ["Nama", state.nama],
            ["NIP", state.nip],
            ["SKPD", state.skpd],
            ["Waktu", state.waktu],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-4 px-4 py-3">
              <dt className="w-16 shrink-0 text-slate-500">{k}</dt>
              <dd className="font-semibold text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-600"
        >
          Kembali ke Beranda
        </Link>
      </Card>
    );
  }

  const fe = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-5">
        {state.status === "error" && <FormAlert>{state.message}</FormAlert>}

        <Field label="Nama Lengkap" htmlFor="nama" error={fe.nama} hint="Beserta gelar, jika ada.">
          <input
            id="nama"
            name="nama"
            required
            minLength={3}
            maxLength={150}
            autoComplete="name"
            placeholder="Contoh: Siti Aminah, S.E."
            aria-invalid={!!fe.nama || undefined}
            className={inputClass}
          />
        </Field>

        <Field label="NIP" htmlFor="nip" error={fe.nip} hint="18 digit, tanpa spasi.">
          <input
            id="nip"
            name="nip"
            required
            inputMode="numeric"
            pattern="\d{18}"
            maxLength={18}
            placeholder="19xxxxxxxxxxxxxxxx"
            aria-invalid={!!fe.nip || undefined}
            className={`${inputClass} font-mono tracking-wider`}
          />
        </Field>

        <SkpdSelect skpds={skpds} error={fe.kode_skpd} />

        <Field label="Nomor HP / WhatsApp" htmlFor="no_hp" error={fe.no_hp}>
          <input
            id="no_hp"
            name="no_hp"
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel"
            maxLength={16}
            placeholder="081234567890"
            aria-invalid={!!fe.no_hp || undefined}
            className={inputClass}
          />
        </Field>

        <div id="bagian-foto" className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-4 sm:p-6">
          <p className="mb-4 text-center text-sm font-semibold text-slate-700">Foto Selfie</p>
          <KameraSelfie
            value={foto}
            onChange={(f) => {
              setFoto(f);
              if (f) setFotoKosong(false);
            }}
            disabled={pending}
            error={fotoKosong ? "Silakan ambil foto selfie terlebih dahulu." : fe.foto}
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-3.5 text-base font-bold text-white shadow-lg shadow-brand-700/25 transition hover:bg-brand-600 disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
          {pending ? "Menyimpan…" : "Kirim Presensi"}
        </button>
      </form>
    </Card>
  );
}
