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

export async function login(formData: FormData) {
  if (!keyValid(String(formData.get("key") ?? "").trim())) redirect("/dashboard?salah=1");
  (await cookies()).set(COOKIE_DASHBOARD, tokenSesi(), { ...opsi, maxAge: 8 * 60 * 60 });
  redirect("/dashboard");
}

export async function logout() {
  (await cookies()).set(COOKIE_DASHBOARD, "", { ...opsi, maxAge: 0 });
  redirect("/dashboard");
}
