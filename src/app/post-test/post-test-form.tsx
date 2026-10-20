"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import Link from "next/link";
import { Award, Loader2, Send } from "lucide-react";
import { Card, Field, FormAlert, SkpdSelect, inputClass } from "@/components/form";
import type { Skpd, SoalPublik } from "@/lib/data";
import { simpanPostTest, type PostTestState } from "./actions";

export function PostTestForm({ skpds, soal }: { skpds: Skpd[]; soal: SoalPublik[] }) {
  const [state, dispatch, pending] = useActionState<PostTestState, FormData>(simpanPostTest, {
    status: "idle",
  });
  const [jawaban, setJawaban] = useState<Record<number, string>>({});
  const [tandaiKosong, setTandaiKosong] = useState(false);

  const terjawab = soal.filter((s) => jawaban[s.id]).length;

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const kosong = soal.find((s) => !jawaban[s.id]);
    if (kosong) {
      setTandaiKosong(true);
      document.getElementById(`soal-${kosong.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const fd = new FormData(e.currentTarget);
    startTransition(() => dispatch(fd));
  }

  if (state.status === "success") {
    return (
      <Card className="text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-gold-100 text-gold-600">
          <Award className="size-9" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-ink">Terima Kasih, {state.nama}</h2>
        <p className="mt-1 text-slate-500">Jawaban post test dan saran/masukan Anda telah tersimpan.</p>
        <div className="mx-auto mt-6 max-w-xs rounded-2xl bg-brand-950 px-6 py-6 text-white">
          <p className="text-sm text-brand-100/70">Nilai Anda</p>
          <p className="text-gradient-gold text-6xl font-extrabold tabular-nums">
            {state.nilai.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-sm text-brand-100/70">
            {state.jumlahBenar} dari {state.jumlahSoal} jawaban benar
          </p>
        </div>
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
    <form onSubmit={onSubmit} className="space-y-6">
      {state.status === "error" && <FormAlert>{fe.jawaban ?? state.message}</FormAlert>}

      <Card>
        <h2 className="mb-5 text-lg font-bold text-ink">Data Peserta</h2>
        <div className="space-y-5">
          <Field label="Nama Lengkap" htmlFor="nama" error={fe.nama}>
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
        </div>
      </Card>

      {/* Progres pengerjaan */}
      <div className="sticky top-3 z-10 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-lg shadow-brand-950/5 backdrop-blur">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-700">Post Test</span>
          <span className="tabular-nums text-slate-500">
            {terjawab}/{soal.length} terjawab
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-gold-400 transition-all duration-500"
            style={{ width: `${(terjawab / soal.length) * 100}%` }}
          />
        </div>
      </div>

      {soal.map((s, i) => {
        const belum = tandaiKosong && !jawaban[s.id];
        return (
          <Card key={s.id} className={belum ? "ring-2 ring-red-300" : ""}>
            <fieldset id={`soal-${s.id}`}>
              <legend className="flex gap-3 text-base font-semibold text-ink">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-950 text-sm text-gold-300 tabular-nums">
                  {i + 1}
                </span>
                <span className="pt-1 whitespace-pre-line">{s.pertanyaan}</span>
              </legend>
              <div className="mt-4 space-y-2.5">
                {s.pilihan.map((p) => {
                  const dipilih = jawaban[s.id] === p.kode;
                  return (
                    <label
                      key={p.kode}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
                        dipilih
                          ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20"
                          : "border-slate-200 hover:border-brand-300 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`soal_${s.id}`}
                        value={p.kode}
                        checked={dipilih}
                        onChange={() => setJawaban((j) => ({ ...j, [s.id]: p.kode }))}
                        className="sr-only"
                      />
                      <span
                        className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                          dipilih ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {p.kode}
                      </span>
                      <span className="pt-0.5 text-slate-700">{p.teks}</span>
                    </label>
                  );
                })}
              </div>
              {belum && <p className="mt-3 text-sm text-red-600">Soal ini belum dijawab.</p>}
            </fieldset>
          </Card>
        );
      })}

      <Card>
        <Field
          label="Saran / Masukan untuk Bimtek Selanjutnya"
          htmlFor="saran"
          error={fe.saran}
          hint="Misalnya topik yang ingin dibahas, metode penyampaian, narasumber, atau teknis penyelenggaraan."
        >
          <textarea
            id="saran"
            name="saran"
            required
            minLength={10}
            maxLength={3000}
            rows={5}
            placeholder="Tuliskan saran dan masukan Anda…"
            aria-invalid={!!fe.saran || undefined}
            className={`${inputClass} resize-y`}
          />
        </Field>

        <button
          type="submit"
          disabled={pending}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-3.5 text-base font-bold text-white shadow-lg shadow-brand-700/25 transition hover:bg-brand-600 disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
          {pending ? "Mengirim…" : "Kirim Jawaban"}
        </button>
        <p className="mt-3 text-center text-xs text-slate-500">
          Post test hanya dapat diisi satu kali untuk setiap NIP.
        </p>
      </Card>
    </form>
  );
}
