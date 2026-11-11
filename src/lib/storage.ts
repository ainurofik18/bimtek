import "server-only";
import path from "node:path";

export function storageDir() {
  return path.resolve(
    /*turbopackIgnore: true*/ process.env.STORAGE_DIR || path.join(process.cwd(), "storage"),
  );
}
