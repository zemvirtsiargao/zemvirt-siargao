const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = Number(process.env.PORT || 3000);
const PI_API_KEY = process.env.PI_API_KEY;
const ROOT = __dirname;
const debugEvents = [];

function addDebugEvent(type, details = {}) {
  debugEvents.unshift({
    type,
    details,
    time: new Date().toISOString(),
  });
  debugEvents.splice(20);
}

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".md": "text/markdown; charset=utf-8",
};

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  let raw = "";
  for await (const chunk of request) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

async function callPiApi(route, body) {
  if (!PI_API_KEY) {
    addDebugEvent("pi_api_key_missing");
    throw new Error("Missing PI_API_KEY environment variable");
  }

  console.log(`Calling Pi API: ${route}`);
  addDebugEvent("pi_api_call", { route });
  const response = await fetch(`https://api.minepi.com/v2${route}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${PI_API_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    addDebugEvent("pi_api_error", { route, status: response.status, data });
    throw new Error(data.message || `Pi API error ${response.status}`);
  }
  addDebugEvent("pi_api_success", { route });
  return data;
}

async function handlePiApi(request, response) {
  const body = await readJson(request);

  if (request.url === "/api/pi/payments/approve") {
    if (!body.paymentId) return sendJson(response, 400, { error: "paymentId is required" });
    console.log(`Approving Pi payment: ${body.paymentId}`);
    addDebugEvent("approve_requested", { paymentId: body.paymentId });
    const data = await callPiApi(`/payments/${body.paymentId}/approve`, null);
    return sendJson(response, 200, data);
  }

  if (request.url === "/api/pi/payments/complete") {
    if (!body.paymentId || !body.txid) {
      return sendJson(response, 400, { error: "paymentId and txid are required" });
    }
    console.log(`Completing Pi payment: ${body.paymentId}`);
    addDebugEvent("complete_requested", { paymentId: body.paymentId, txid: body.txid });
    const data = await callPiApi(`/payments/${body.paymentId}/complete`, { txid: body.txid });
    return sendJson(response, 200, data);
  }

  return sendJson(response, 404, { error: "Unknown API route" });
}

function serveStatic(request, response) {
  const urlPath = decodeURIComponent(new URL(request.url, `http://localhost:${PORT}`).pathname);
  const cleanPath = urlPath === "/" ? "/index.html" : urlPath;
  const filePath = path.normalize(path.join(ROOT, cleanPath));

  if (!filePath.startsWith(ROOT)) {
    response.writeHead(403);
    return response.end("Forbidden");
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
    response.end(content);
  });
}

const server = http.createServer((request, response) => {
  if (request.method === "GET" && request.url === "/api/pi/health") {
    sendJson(response, 200, {
      ok: true,
      app: "Zemvirt Siargao",
      piApiKeyConfigured: Boolean(PI_API_KEY),
    });
    return;
  }

  if (request.method === "GET" && request.url === "/api/pi/debug") {
    sendJson(response, 200, {
      ok: true,
      events: debugEvents,
    });
    return;
  }

  if (request.method === "POST" && request.url.startsWith("/api/pi/")) {
    handlePiApi(request, response).catch((error) => {
      console.error(error);
      addDebugEvent("server_error", { message: error.message });
      sendJson(response, 500, { error: error.message });
    });
    return;
  }

  if (request.method === "GET") {
    serveStatic(request, response);
    return;
  }

  response.writeHead(405);
  response.end("Method not allowed");
});

server.listen(PORT, () => {
  console.log(`Zemvirt Siargao running at http://localhost:${PORT}`);
});
