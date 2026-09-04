import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  server: { proxy: { '/api': { target: 'http://localhost:3000', ws: true } } },
  plugins: [react()],
});
