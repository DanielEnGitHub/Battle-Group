import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Escucha en todas las interfaces para que los celulares en la LAN puedan conectarse.
    // Los jugadores acceden via: http://<IP-de-la-PC>:5173
    host: true,
    port: 5173,
  },
})
