import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // En desarrollo, redirige cualquier ruta al index.html para que React Router funcione.
    // Esto evita el "Cannot GET /dashboard" al recargar en dev server.
    historyApiFallback: true,
  },
  preview: {
    // Mismo comportamiento para `vite preview`.
    historyApiFallback: true,
  },
});
