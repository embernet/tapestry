import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Cast process to any to avoid TS error: Property 'cwd' does not exist on type 'Process'
  const env = loadEnv(mode, (process as any).cwd(), '');
  // Anything Vite defines ends up in the bundle every user downloads, so an AI key
  // never goes here: users enter their own in Settings, and the shared key stays
  // on the server (server/ai.js). Refuse to build with one set.
  for (const name of ['API_KEY', 'GEMINI_API_KEY']) {
    if (env[name]) throw new Error(`${name} is set: unset it before building. A key in the build is visible to every user.`);
  }
  return {
    plugins: [react()],
    define: {
      'process.env': {}
    }
  }
})
