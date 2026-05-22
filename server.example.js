const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = Number(process.env.PORT || 3000);
const PI_API_KEY = process.env.PI_API_KEY;
const ROOT = __dirname;

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

async function callPiApi(route, body) {
  if (!PI_API_KEY) throw new Error("Missing PI_API_KEY environment variable");

  const response = await fetch(`https://api.minepi.com/v2${route}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${PI_API_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Pi API error ${response.status}`);
  return data;
}

async function handlePiApi(req, res) {
  const body = await readJson(req);

  if (req.url === "/api/pi/payments/approve") {
    if (!body.paymentId) return sendJson(res, 400, { error: "paymentId is required" });
    const data = await callPiApi(`/payments/${body.paymentId}/approve`, null);
    return sendJson(res, 200, data);
  }

  if (req.url === "/api/pi/payments/complete") {
    if (!body.paymentId || !body.txid) {
      return sendJson(res, 400, { error: "paymentId and txid are required" });
    }
    const data = await callPiApi(`/payments/${body.paymentId}/complete`, { txid: body.txid });
    return sendJson(res, 200, data);
  }

  sendJson(res, 404, { error: "Unknown API route" });
}

function serveStatic(req, res) {
  const urlPath = new URL(req.url, `http://localhost:${PORT}`).pathname;
  const cleanPath = urlPath === "/" ? "/index.html" : urlPath;
  const filePath = path.normalize(path.join(ROOT, cleanPath));

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      return res.end("Not found");
    }
    res.writeHead(200);
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/api/pi/health") {
    return sendJson(res, 200, {
      ok: true,
      app: "Zemvirt Siargao",
      piApiKeyConfigured: Boolean(PI_API_KEY),
    });
  }

  if (req.method === "POST" && req.url.startsWith("/api/pi/")) {
    return handlePiApi(req, res).catch((error) => sendJson(res, 500, { error: error.message }));
  }

  if (req.method === "GET") return serveStatic(req, res);

  res.writeHead(405);
  res.end("Method not allowed");
});

server.listen(PORT, () => {
  console.log(`Zemvirt Siargao running on port ${PORT}`);
});
