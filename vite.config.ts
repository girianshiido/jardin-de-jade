import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';
export default defineConfig({
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [vinext()],
  server: {
    host: '0.0.0.0',
    port: 5187,
    strictPort: true,
    watch: { useFsEvents: false, usePolling: true },
  },
});
