import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Not the default /assets: browsers may still cache a looping 308 from an old deploy on those URLs.
  build: { assetsDir: 'static' },
});
