const fs = require("fs");
const path = require("path");
const http = require("http");
const { spawn } = require("child_process");
const { DEFAULT_SETTINGS, calculate, sanitizeSettings } = require("./lib/domain");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "settings.json");
const PUBLIC_DIR = path.join(__dirname, "public");

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2));
  }
}

function readSettings() {
  ensureDataFile();

  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (error) {
    return { ...DEFAULT_SETTINGS };
  }
}

function writeSettings(settings) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(settings, null, 2));
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function sendFile(response, filePath) {
  const extension = path.extname(filePath);
  const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml"
  };

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentTypes[extension] || "application/octet-stream"
    });
    response.end(data);
  });
}

function handleApi(request, response) {
  if (request.method === "GET" && request.url === "/api/settings") {
    const settings = readSettings();
    sendJson(response, 200, { settings, metrics: calculate(settings) });
    return true;
  }

  if (request.method === "POST" && request.url === "/api/settings") {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        const parsed = JSON.parse(body || "{}");
        const settings = sanitizeSettings(parsed);
        writeSettings(settings);
        sendJson(response, 200, { settings, metrics: calculate(settings) });
      } catch (error) {
        sendJson(response, 400, { error: "Ongeldige JSON ontvangen." });
      }
    });

    return true;
  }

  return false;
}

function tryOpenWindowsBrowser(url) {
  if (process.env.OPEN_BROWSER === "0") {
    return;
  }

  const candidates = [
    { command: "/mnt/c/Windows/explorer.exe", args: [url] },
    { command: "/mnt/c/Windows/System32/cmd.exe", args: ["/C", "start", "", url] },
    { command: "wslview", args: [url] }
  ];

  for (const candidate of candidates) {
    try {
      if (!path.isAbsolute(candidate.command) && !commandExists(candidate.command)) {
        continue;
      }

      const child = spawn(candidate.command, candidate.args, {
        detached: true,
        stdio: "ignore"
      });
      child.unref();
      return;
    } catch (error) {
      continue;
    }
  }
}

function commandExists(command) {
  const pathEntries = (process.env.PATH || "").split(path.delimiter);
  return pathEntries.some((entry) => fs.existsSync(path.join(entry, command)));
}

const server = http.createServer((request, response) => {
  if (handleApi(request, response)) {
    return;
  }

  const requestedPath = request.url === "/" ? "/index.html" : request.url;
  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  sendFile(response, filePath);
});

server.listen(PORT, HOST, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Brandstof-app draait op ${url}`);
  console.log("Persistente instellingen worden opgeslagen in data/settings.json");
  tryOpenWindowsBrowser(url);
});
