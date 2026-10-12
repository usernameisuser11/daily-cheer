"use strict";
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = Number(process.env.PORT || 3000);
const html = fs.readFileSync(path.join(__dirname, "index.html"));

http.createServer((req, res) => {
  const url = (req.url || "/").split("?")[0];
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Allow": "GET, HEAD" });
    res.end();
    return;
  }
  if (url === "/favicon.ico") {
    res.writeHead(204);
    res.end();
    return;
  }
  if (url !== "/" && url !== "/index.html") {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "public, max-age=60",
    "X-Content-Type-Options": "nosniff"
  });
  if (req.method === "HEAD") res.end();
  else res.end(html);
}).listen(PORT, "0.0.0.0", () => {
  console.log("Daily Cheer listening on port " + PORT);
});
