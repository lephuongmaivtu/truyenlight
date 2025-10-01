import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // alias chuẩn để import từ src
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
  },
  build: {
    target: 'esnext',
    outDir: 'dist', // Vercel build xong sẽ lấy dist làm output
  },
  server: {
    port: 3000,
    open: true,
  },
  base: './', // quan trọng: để assets load đúng khi deploy
})
