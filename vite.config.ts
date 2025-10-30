import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // ✅ Ép tất cả thư viện dùng cùng 1 instance React
      react: path.resolve("./node_modules/react"),
      "react-dom": path.resolve("./node_modules/react-dom"),
    },
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
  },

  build: {
    target: "esnext",
    outDir: "dist",
    sourcemap: true, // ✅ Bật source map để xem lỗi gốc nếu trắng trang
    chunkSizeWarningLimit: 2000, // ✅ Ngăn cảnh báo >500kb
  },

  server: {
    port: 3000,
    open: true,
  },

  // ⚠️ Bắt buộc để "/" khi deploy trên Vercel
  base: "/",
});
