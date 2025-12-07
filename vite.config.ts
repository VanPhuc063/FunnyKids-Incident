import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: './', // Đặt thư mục gốc là thư mục hiện tại
  build: {
    outDir: 'dist',
  }
})