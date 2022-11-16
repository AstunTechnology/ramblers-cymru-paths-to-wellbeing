import { resolve } from 'path';

export default {
  root: 'src',
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
        assetFileNames: "map.[ext]",
      },
    },
  }
}
