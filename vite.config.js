import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
export default defineConfig({plugins:[react(),tailwind()],base:'./',build:{outDir:'build',assetsDir:'assets',chunkSizeWarningLimit:1600},server:{port:4180}});
