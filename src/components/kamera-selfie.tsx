"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, RefreshCw, SwitchCamera, VideoOff } from "lucide-react";

export type FotoSelfie = { blob: Blob; url: string };

const LEBAR_MAKS = 720;
const KUALITAS_JPEG = 0.85;

type Mode = "idle" | "starting" | "live" | "error";

/** Gambar sumber ke canvas (maks. 720px), beri cap waktu, lalu jadikan JPEG. */
async function keJpeg(
  source: CanvasImageSource,
  w: number,
  h: number,
  mirror: boolean,
): Promise<Blob> {
  const skala = Math.min(1, LEBAR_MAKS / w);
  const cw = Math.round(w * skala);
  const ch = Math.round(h * skala);
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d")!;
  if (mirror) {
    ctx.translate(cw, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, 0, 0, cw, ch);
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  const waktu = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
  const teks = `Presensi Bimtek LKD 2026 • ${waktu} WIB`;
  const fs = Math.max(12, Math.round(cw / 36));
  ctx.fillStyle = "rgba(3, 42, 36, 0.65)";
  ctx.fillRect(0, ch - fs * 2, cw, fs * 2);
  ctx.fillStyle = "#ffffff";
  ctx.font = `600 ${fs}px system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillText(teks, fs * 0.7, ch - fs, cw - fs * 1.4);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Gagal memproses foto"))),
      "image/jpeg",
      KUALITAS_JPEG,
    ),
  );
}

function pesanError(err: unknown) {
  const name = (err as { name?: string })?.name;
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Izin kamera ditolak. Izinkan akses kamera pada pengaturan browser, lalu coba lagi.";
  if (name === "NotFoundError" || name === "OverconstrainedError")
    return "Kamera tidak ditemukan pada perangkat ini.";
  if (name === "NotReadableError")
    return "Kamera sedang dipakai aplikasi lain. Tutup aplikasi tersebut lalu coba lagi.";
  return "Kamera tidak dapat dibuka. Gunakan tombol unggah foto di bawah.";
}

export function KameraSelfie({
  value,
  onChange,
  error,
  disabled,
}: {
  value: FotoSelfie | null;
  onChange: (foto: FotoSelfie | null) => void;
  error?: string;
  disabled?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [pesan, setPesan] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  // Bebaskan object URL lama ketika foto berganti
  useEffect(() => {
    const url = value?.url;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [value?.url]);

  async function start(arah = facing) {
    setPesan(null);
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setMode("error");
      setPesan(
        "Browser tidak mengizinkan akses kamera (halaman harus dibuka melalui HTTPS). Gunakan tombol unggah foto di bawah.",
      );
      return;
    }
    stop();
    setMode("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: arah, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setMode("live");
    } catch (err) {
      setMode("error");
      setPesan(pesanError(err));
    }
  }

  async function ambil() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const blob = await keJpeg(v, v.videoWidth, v.videoHeight, facing === "user");
    stop();
    setMode("idle");
    onChange({ blob, url: URL.createObjectURL(blob) });
  }

  async function dariFile(file: File | undefined) {
    if (!file) return;
    try {
      const bmp = await createImageBitmap(file);
      const blob = await keJpeg(bmp, bmp.width, bmp.height, false);
      bmp.close();
      onChange({ blob, url: URL.createObjectURL(blob) });
      setPesan(null);
    } catch {
      setPesan("File tidak dapat dibaca sebagai gambar.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function ulang() {
    onChange(null);
    void start();
  }

  function putar() {
    const arah = facing === "user" ? "environment" : "user";
    setFacing(arah);
    void start(arah);
  }

  const tampilVideo = !value && (mode === "live" || mode === "starting");

  return (
    <div>
      <div
        className={`relative mx-auto aspect-[3/4] w-full max-w-xs overflow-hidden rounded-2xl border-2 bg-brand-950 ${
          error ? "border-red-400" : "border-brand-100"
        }`}
      >
        {/* Video selalu dirender agar ref tersedia saat stream dimulai */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`absolute inset-0 size-full object-cover ${facing === "user" ? "-scale-x-100" : ""} ${
            tampilVideo ? "" : "hidden"
          }`}
        />

        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value.url} alt="Foto selfie" className="absolute inset-0 size-full object-cover" />
        )}

        {mode === "live" && !value && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
            <div className="h-[62%] w-[70%] rounded-[50%] border-2 border-dashed border-white/60" />
          </div>
        )}

        {mode === "starting" && !value && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-brand-100">
            Membuka kamera…
          </div>
        )}

        {!value && (mode === "idle" || mode === "error") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-white/10 text-gold-300">
              {mode === "error" ? <VideoOff className="size-7" /> : <Camera className="size-7" />}
            </div>
            <p className="text-sm text-brand-100/80">
              {mode === "error" ? "Kamera tidak tersedia" : "Ambil foto selfie sebagai bukti kehadiran"}
            </p>
          </div>
        )}

        {mode === "live" && !value && (
          <button
            type="button"
            onClick={putar}
            className="absolute top-3 right-3 rounded-full bg-black/40 p-2 text-white backdrop-blur transition hover:bg-black/60"
            aria-label="Ganti kamera depan/belakang"
          >
            <SwitchCamera className="size-5" />
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {value ? (
          <button
            type="button"
            onClick={ulang}
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className="size-4" /> Foto Ulang
          </button>
        ) : mode === "live" ? (
          <button
            type="button"
            onClick={ambil}
            className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-5 py-2.5 text-sm font-bold text-brand-950 shadow-lg shadow-gold-500/30 transition hover:bg-gold-300"
          >
            <Camera className="size-4" /> Ambil Foto
          </button>
        ) : (
          <button
            type="button"
            onClick={() => start()}
            disabled={disabled || mode === "starting"}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-60"
          >
            <Camera className="size-4" /> {mode === "error" ? "Coba Lagi" : "Buka Kamera"}
          </button>
        )}
      </div>

      {(pesan || error) && !value && (
        <p className={`mt-3 text-center text-sm ${error ? "text-red-600" : "text-amber-700"}`}>
          {pesan ?? error}
        </p>
      )}

      {mode === "error" && !value && (
        <div className="mt-3 text-center">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => dariFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
          >
            <ImagePlus className="size-4" /> Unggah foto dari kamera perangkat
          </button>
        </div>
      )}
    </div>
  );
}
