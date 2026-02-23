import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// Serve static files from the dist directory (Vite's build output)
app.use(express.static(path.join(__dirname, 'dist')));

// Proxy configuration for Gemini API
app.use('/api-proxy', createProxyMiddleware({
  target: 'https://generativelanguage.googleapis.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api-proxy': '', // remove /api-proxy prefix
  },
  onProxyReq: (proxyReq, req, res) => {
    // Debug logging to understand what is being proxied
    console.log(`[Proxy] ${req.method} ${req.url}`);

    const keyHeader = req.headers['x-goog-api-key'];
    const queryKey = req.query.key;


    if (keyHeader) {
      console.log('[Proxy] x-goog-api-key header present (length: ' + keyHeader.length + ')');
    } else if (queryKey) {
      console.log('[Proxy] x-goog-api-key header MISSING, but found in query. Promoting to header.');
      proxyReq.setHeader('x-goog-api-key', queryKey);
    } else {
      console.log('[Proxy] x-goog-api-key header and query param MISSING!');
    }

    if (queryKey) {
      console.log('[Proxy] key query param present');
    }
  }
}));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});