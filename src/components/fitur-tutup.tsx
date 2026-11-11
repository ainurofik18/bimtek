import { Lock } from "lucide-react";
import { Card } from "@/components/form";

export function FiturTutup({ judul, teks }: { judul: string; teks: string }) {
  return (
    <Card className="text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Lock className="size-7" />
      </div>
      <h2 className="mt-4 text-xl font-bold text-ink">{judul}</h2>
      <p className="mt-1 text-slate-500">{teks}</p>
    </Card>
  );
}
