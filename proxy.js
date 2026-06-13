// local proxy

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
app.disable('x-powered-by');

const UIProxyMiddleware = createProxyMiddleware({
    target: 'http://localhost:5173',
    changeOrigin: false // no cross origin frame issues just in case
});

const APIProxyMiddleware = createProxyMiddleware({
    target: 'http://localhost:3000/api/v1',
    changeOrigin: false // no cross origin frame issues just in case - changes host header
});

app.use('/api/v1', APIProxyMiddleware);

// catch-all: must come after specific routes — Vite handles history mode fallback (returns index.html for unknown routes)
app.use('/', UIProxyMiddleware);

app.listen(4200, () => {
    console.log("Proxy running on port 4200...");
});

