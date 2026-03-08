const BINANCE_C2C_ENDPOINT =
  "https://api.binance.com/sapi/v1/c2c/orderMatch/listUserOrderHistory";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
    },
  });

const signHmacSha256 = async (secret, payload) => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const normalizeParams = (params) => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null || value === "") continue;
    query.set(key, String(value));
  }
  query.set("timestamp", Date.now().toString());
  return query;
};

const proxyBinanceRequest = async (request) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400);
  }

  const apiKey = String(body?.apiKey || "").trim();
  const apiSecret = String(body?.apiSecret || "").trim();
  const params = body?.params || {};

  if (!apiKey || !apiSecret) {
    return jsonResponse({ error: "API key and secret are required." }, 400);
  }

  const query = normalizeParams(params);
  const signature = await signHmacSha256(apiSecret, query.toString());
  query.set("signature", signature);

  const response = await fetch(`${BINANCE_C2C_ENDPOINT}?${query.toString()}`, {
    method: "GET",
    headers: {
      "X-MBX-APIKEY": apiKey,
    },
  });

  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return new Response(text, {
      status: response.status,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  }

  return new Response(text, {
    status: response.status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": contentType || "text/plain; charset=utf-8",
    },
  });
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    if (url.pathname !== "/api/binance/c2c-history") {
      return jsonResponse({ error: "Not found." }, 404);
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed. Use POST." }, 405);
    }

    try {
      return await proxyBinanceRequest(request);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown proxy error.";
      return jsonResponse({ error: message }, 500);
    }
  },
};
