import "server-only";
import mysql from "mysql2/promise";

declare global {
  var __bimtekPool: mysql.Pool | undefined;
}

function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "bimtek",
    connectionLimit: Number(process.env.DB_POOL_LIMIT ?? 10),
    timezone: "+07:00",
    dateStrings: true,
    charset: "utf8mb4_unicode_ci",
  });
}

// Simpan pool di globalThis supaya tidak membuat koneksi baru setiap hot reload saat dev.
export const db: mysql.Pool = globalThis.__bimtekPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalThis.__bimtekPool = db;

export function isDuplicateError(err: unknown) {
  return (err as { code?: string })?.code === "ER_DUP_ENTRY";
}
