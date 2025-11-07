import { defineConfig, loadEnv } from "vite"; // Import loadEnv
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables based on the current mode
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      host: "::",
      port: 8080,
      // Add this proxy to forward /api requests to your backend
      proxy: {
        '/api': {
          // Use the environment variable here
          target: env.VITE_BACKEND_URL,
          changeOrigin: true,
        },
      }
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});