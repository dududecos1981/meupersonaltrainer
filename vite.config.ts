import { defineConfig } from 'vite';

export default defineConfig({
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2022',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('@supabase')) {
            return 'supabase';
          }
        }
      }
    }
  },
  server: {
    port: 5174,
    strictPort: false
  },
  preview: {
    port: 4173
  },
  // @ts-ignore
  test: {
    environment: 'happy-dom',
    globals: true
  }
});
