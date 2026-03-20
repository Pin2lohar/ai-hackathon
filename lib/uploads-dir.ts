import { mkdir } from "fs/promises";
import path from "path";

export async function ensureUploadsDir(): Promise<string> {
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  return dir;
}
