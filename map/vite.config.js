import { resolve } from 'path';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  root: 'src',
  plugins: [svelte({})],
  build: {
    // Ensure files are written to the dist at the root of this
    // package, not in src/dist
    outDir: resolve(__dirname, 'dist'),
    sourcemap: true,
    lib: {
      fileName: 'map',
      entry: 'main.js',
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        assetFileNames: 'map.[ext]',
      },
    },
  },
});
