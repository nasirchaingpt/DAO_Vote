import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * GitHub project Pages: `https://<user>.github.io/<repo>/` → set `VITE_BASE=/<repo>/`.
 * Local dev: leave unset (defaults to `/`).
 */
function normalizeBase(raw: string | undefined): string {
  if (raw === undefined || raw === "" || raw === "/") return "/";
  let b = raw.startsWith("/") ? raw : `/${raw}`;
  if (!b.endsWith("/")) b += "/";
  return b;
}

const base = normalizeBase(process.env.VITE_BASE);

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5173,
  },
});
