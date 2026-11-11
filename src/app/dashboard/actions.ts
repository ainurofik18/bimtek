"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_DASHBOARD, keyValid, tokenSesi } from "@/lib/auth";

const opsi = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/dashboard",
} as const;

// Whitelist tujuan redirect agar `next` dari form tidak bisa dipakai sebagai open redirect.
const HALAMAN = new Set(["/dashboard", "/dashboard/post-test"]);
const tujuan = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "");
  return HALAMAN.has(s) ? s : "/dashboard";
};

export async function login(formData: FormData) {
  const next = tujuan(formData.get("next"));
  if (!keyValid(String(formData.get("key") ?? "").trim())) redirect(`${next}?salah=1`);
  (await cookies()).set(COOKIE_DASHBOARD, tokenSesi(), { ...opsi, maxAge: 8 * 60 * 60 });
  redirect(next);
}

export async function logout(formData: FormData) {
  (await cookies()).set(COOKIE_DASHBOARD, "", { ...opsi, maxAge: 0 });
  redirect(tujuan(formData.get("next")));
}
