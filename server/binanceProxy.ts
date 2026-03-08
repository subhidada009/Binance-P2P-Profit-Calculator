import { createHmac } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin, PreviewServer, ViteDevServer } from 'vite';

type BinanceProxyRequest = {
  apiKey?: string;
  apiSecret?: string;
  params?: Record<string, string | number | undefined>;
};

const BINANCE_C2C_PATH = '/sapi/v1/c2c/orderMatch/listUserOrderHistory';

const sendJson = (res: ServerResponse, statusCode: number, payload: unknown) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const readJsonBody = async (req: IncomingMessage): Promise<BinanceProxyRequest> => {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as BinanceProxyRequest;
};

const normalizeParams = (params: BinanceProxyRequest['params']) => {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null || value === '') continue;
    query.set(key, String(value));
  }

  query.set('timestamp', Date.now().toString());
  return query;
};

const proxyRequest = async (
  req: IncomingMessage,
  res: ServerResponse
) => {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    const { apiKey, apiSecret, params } = await readJsonBody(req);

    if (!apiKey || !apiSecret) {
      sendJson(res, 400, { error: 'API key and secret are required.' });
      return;
    }

    const query = normalizeParams(params);
    const signature = createHmac('sha256', apiSecret)
      .update(query.toString())
      .digest('hex');
    query.set('signature', signature);

    const response = await fetch(`https://api.binance.com${BINANCE_C2C_PATH}?${query.toString()}`, {
      headers: {
        'X-MBX-APIKEY': apiKey,
      },
    });

    const text = await response.text();
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      sendJson(res, response.status, JSON.parse(text));
      return;
    }

    res.statusCode = response.status;
    res.setHeader('Content-Type', contentType || 'text/plain; charset=utf-8');
    res.end(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown proxy error';
    sendJson(res, 500, { error: message });
  }
};

const attachMiddleware = (server: ViteDevServer | PreviewServer) => {
  server.middlewares.use('/api/binance/c2c-history', proxyRequest);
};

export const binanceC2CProxyPlugin = (): Plugin => ({
  name: 'binance-c2c-proxy',
  configureServer(server) {
    attachMiddleware(server);
  },
  configurePreviewServer(server) {
    attachMiddleware(server);
  },
});
