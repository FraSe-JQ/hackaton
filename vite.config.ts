import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages publica este repositorio bajo /hackaton/; en local seguimos usando /
  base: process.env.NODE_ENV === 'production' ? '/hackaton/' : '/',
  plugins: [react()],
})
