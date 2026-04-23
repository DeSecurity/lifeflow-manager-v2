import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath, URL } from "node:url";
import { componentTagger } from "lovable-tagger";

// For GitHub Pages project sites, set BASE_PATH (e.g. "/my-repo/") at build time.
// Defaults to "/" so Lovable preview and root deployments keep working.
const base = process.env.BASE_PATH || "/";

export default defineConfig(({ mode }) => ({
  base,
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  server: {
    host: "::",
    port: 8080,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
}));
