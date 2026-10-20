import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/form";
import { PageHero, SiteFooter } from "@/components/site-chrome";
import { getSkpds } from "@/lib/data";
import { PresensiForm } from "./presensi-form";

export const metadata: Metadata = {
  title: "Presensi Peserta",
};

async function PresensiLoader() {
  const skpds = await getSkpds();
  return <PresensiForm skpds={skpds} />;
}

export default function PresensiPage() {
  return (
    <>
      <PageHero
        eyebrow="Presensi Peserta"
        title="Isi Daftar Hadir"
        description="Lengkapi data diri Anda dan ambil foto selfie sebagai bukti kehadiran pada kegiatan bimbingan teknis."
      />
      <main className="relative mx-auto -mt-20 w-full max-w-3xl px-4 pb-16 sm:px-6">
        <Suspense fallback={<FormSkeleton />}>
          <PresensiLoader />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
