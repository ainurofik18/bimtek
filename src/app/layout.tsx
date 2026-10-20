import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ACARA } from "@/lib/acara";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const judulLengkap = `${ACARA.judul} Tahun ${ACARA.tahun}`;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "https://bimtek.elkpd.id"),
  title: {
    default: `${judulLengkap} | ${ACARA.penyelenggaraSingkat} ${ACARA.daerah}`,
    template: `%s | Bimtek LKD ${ACARA.tahun}`,
  },
  description: `Presensi, post test, dan materi ${judulLengkap} yang diselenggarakan oleh ${ACARA.penyelenggara} ${ACARA.daerah}.`,
};

export const viewport: Viewport = {
  themeColor: "#032a24",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
