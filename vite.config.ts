import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '0.0.0.0',   // allow access from your network
    port: 8080,
    strictPort: true,  // fail if port is already in use
    // Proxy all API and WebSocket requests to backend
    // This allows frontend to use relative URLs like /api/auth/login
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,  // keep the /api prefix
      },
      '/socket.io': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        ws: true,  // Enable WebSocket proxying
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('WebSocket proxy error:', err.message);
          });
          proxy.on('proxyReqWs', (proxyReq, req, socket) => {
            socket.on('error', (err) => {
              console.error('WebSocket proxy socket error:', err.message);
            });
          });
        }
      }
    },
    headers: {
      // More permissive CSP for development
      'Content-Security-Policy': mode === 'development' 
        ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: ws: wss: http: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:* https://checkout.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://checkout.razorpay.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:* wss://localhost:* wss://127.0.0.1:* https: https://api.razorpay.com; frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com; object-src 'none'; base-uri 'self'; form-action 'self';"
        : "default-src 'self'; script-src 'self' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://checkout.razorpay.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https: https://api.razorpay.com; frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com; object-src 'none'; base-uri 'self'; form-action 'self';"
    }
  },
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Production build optimizations
    target: 'es2015',
    minify: 'terser',
    sourcemap: mode === 'development' || process.env.VITE_ENABLE_SOURCE_MAPS === 'true',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        passes: 2,
        pure_funcs: mode === 'production' ? ['console.log', 'console.debug', 'console.info'] : [],
      },
      mangle: {
        safari10: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split node_modules into separate chunks
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // UI libraries
            if (id.includes('@radix-ui')) {
              return 'vendor-ui';
            }
            // Data fetching
            if (id.includes('@tanstack') || id.includes('axios')) {
              return 'vendor-data';
            }
            // Charts and visualization
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-charts';
            }
            // QR and camera libraries
            if (id.includes('qrcode') || id.includes('html5-qrcode') || id.includes('@zxing')) {
              return 'vendor-qr';
            }
            // Form libraries
            if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
              return 'vendor-forms';
            }
            // Other node_modules
            return 'vendor-misc';
          }
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,
    cssCodeSplit: true, // Split CSS into separate files per chunk
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
  },
  define: {
    // Remove console logs in production
    __DEV__: mode === 'development',
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}));