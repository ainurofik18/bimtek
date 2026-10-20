import type { Metadata } from "next";
import { Suspense } from "react";
import { ClipboardList } from "lucide-react";
import { Card, FormSkeleton } from "@/components/form";
import { PageHero, SiteFooter } from "@/components/site-chrome";
import { getSkpds, getSoalPublik } from "@/lib/data";
import { PostTestForm } from "./post-test-form";

export const metadata: Metadata = {
  title: "Post Test & Saran",
};

async function PostTestLoader() {
  const [skpds, soal] = await Promise.all([getSkpds(), getSoalPublik()]);

  if (soal.length === 0) {
    return (
      <Card className="text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <ClipboardList className="size-7" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-ink">Post test belum dibuka</h2>
        <p className="mt-1 text-slate-500">Soal akan tersedia di akhir kegiatan. Silakan cek kembali nanti.</p>
      </Card>
    );
  }

  return <PostTestForm skpds={skpds} soal={soal} />;
}

export default function PostTestPage() {
  return (
    <>
      <PageHero
        eyebrow="Evaluasi Peserta"
        title="Post Test & Saran"
        description="Jawab seluruh soal pilihan ganda berikut, lalu sampaikan saran dan masukan Anda untuk penyelenggaraan bimtek berikutnya."
      />
      <main className="relative mx-auto -mt-20 w-full max-w-3xl px-4 pb-16 sm:px-6">
        <Suspense fallback={<FormSkeleton />}>
          <PostTestLoader />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
