import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

const isSingleFile = process.env.SINGLEFILE === '1';

export default defineConfig({
  base: './',
  plugins: isSingleFile ? [react(), viteSingleFile()] : [react()],
  build: {
    outDir: isSingleFile ? 'dist-single' : 'dist',
    emptyOutDir: true,
  },
});
