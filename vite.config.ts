import { defineConfig, type HtmlTagDescriptor, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

/**
 * Deployment settings come from the environment so the same source works
 * locally, on a GitHub Pages project site (/repo-name/) and on a user site (/).
 *
 *   BASE_PATH  – public base path, e.g. "/joo-joo/" (default "/").
 *   SITE_URL   – absolute URL of the deployed site, e.g.
 *                "https://username.github.io/joo-joo". Used for canonical,
 *                og:url and og:image. Optional; omitted tags when unset.
 *
 * The GitHub Actions workflow sets both from actions/configure-pages.
 */
const BASE_PATH = normalizeBase(process.env.BASE_PATH);
const SITE_URL = process.env.SITE_URL?.replace(/\/+$/, "") || "";

export default defineConfig({
  base: BASE_PATH,
  plugins: [react(), tailwindcss(), socialMeta(SITE_URL)],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: {
    target: "es2020",
    assetsInlineLimit: 4096,
  },
  server: {
    host: process.env.HOST || "localhost",
    port: Number(process.env.PORT) || 5173,
  },
});

function normalizeBase(value: string | undefined): string {
  if (!value || value === "/") return "/";
  return `/${value.replace(/^\/+|\/+$/g, "")}/`;
}

/** Adds absolute-URL social tags when SITE_URL is known. */
function socialMeta(siteUrl: string): Plugin {
  return {
    name: "joo-social-meta",
    transformIndexHtml() {
      if (!siteUrl) return [];
      const tags: HtmlTagDescriptor[] = [
        { tag: "link", attrs: { rel: "canonical", href: `${siteUrl}/` }, injectTo: "head" },
        { tag: "meta", attrs: { property: "og:url", content: `${siteUrl}/` }, injectTo: "head" },
        { tag: "meta", attrs: { property: "og:image", content: `${siteUrl}/og-image.png` }, injectTo: "head" },
        { tag: "meta", attrs: { name: "twitter:image", content: `${siteUrl}/og-image.png` }, injectTo: "head" },
      ];
      return tags;
    },
  };
}
