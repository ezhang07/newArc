import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {alias: { "@": path.resolve(__dirname, "./src")}},
  // Always run the dev server on 5173. strictPort makes Vite fail loudly
  // if 5173 is taken, instead of silently drifting to 5174, 5175, ...
  server: { port: 5173, strictPort: true },
})
