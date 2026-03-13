

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Binance P2P API Sync

- Open `History` and use the new `Binance API` button.
- This sync uses Binance's official C2C endpoint: `GET /sapi/v1/c2c/orderMatch/listUserOrderHistory`.
- Binance limits this endpoint to the last 6 months and a maximum 30-day window per request. The app splits the range automatically.
- You must use a read-only HMAC API key.
- Local `vite` runs include a built-in proxy at `/api/binance/c2c-history`.
- Live domain now uses a default Cloudflare Worker proxy automatically.
- `Proxy URL` in the modal is optional and only needed if you want to override with your own worker.

### Cloudflare Worker Proxy (for live domain)

Worker files are ready in [`cloudflare-worker`](./cloudflare-worker):
- `cloudflare-worker/worker.js`
- `cloudflare-worker/wrangler.toml`

Deploy steps:
1. Install Wrangler: `npm i -g wrangler`
2. Login: `wrangler login`
3. Deploy:
   - `cd cloudflare-worker`
   - `wrangler deploy`
4. Copy your worker URL (example: `https://binance-c2c-proxy.<subdomain>.workers.dev`)
5. In the app modal (`History -> Binance API`), paste that URL into `Proxy URL` and sync.

Notes:
- The app will automatically call `<proxy-url>/api/binance/c2c-history`.
- Keep your Binance API key read-only.
