import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 29463,
    strictPort: true,
  },
  preview: {
    port: 29463,
    strictPort: true,
  },
});
