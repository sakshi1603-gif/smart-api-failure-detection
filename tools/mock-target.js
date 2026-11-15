// Known-behavior target for tests and benchmarks.
// Run: node mock-target.js   (port 4000)
// Monitor it with ALLOW_LOOPBACK_TARGETS=true on the backend.
const http = require("http");
let flakyCount = 0;

http
  .createServer((req, res) => {
    const u = new URL(req.url, "http://x");
    const send = (code, body = "ok") => {
      res.writeHead(code, { "Content-Type": "text/plain" });
      res.end(body);
    };
    switch (u.pathname) {
      case "/ok": return send(200);
      case "/404": return send(404, "not found");
      case "/500": return send(500, "boom");
      case "/503": return send(503, "down");
      case "/slow":
        return setTimeout(() => send(200), Number(u.searchParams.get("ms") || 1500));
      case "/hang": return; // never responds -> timeout
      case "/flaky": return send(++flakyCount % 3 === 0 ? 200 : 500); // 2 of 3 fail
      case "/redirect-ok":
        res.writeHead(302, { Location: "/ok" });
        return res.end();
      case "/redirect-metadata": // SSRF via redirect
        res.writeHead(302, { Location: "http://169.254.169.254/latest/meta-data/" });
        return res.end();
      default: return send(404);
    }
  })
  .listen(4000, () => console.log("mock target on :4000"));
