// email-bridge 本地运行入口（冷弦写的包装层）
// 把 Vercel 风格的 handler 包装成本地 HTTP 服务
const http = require('http');
const { URL } = require('url');

const routes = {
  '/api/send': require('./api/send'),
  '/api/inbox': require('./api/inbox'),
  '/api/read': require('./api/read'),
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const handler = routes[url.pathname];

  if (!handler) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', async () => {
    let parsedBody = {};
    try { parsedBody = body ? JSON.parse(body) : {}; } catch (e) { /* ignore */ }

    const mockReq = {
      method: req.method,
      headers: req.headers,
      query: Object.fromEntries(url.searchParams),
      body: parsedBody,
    };

    const mockRes = {
      _code: 200,
      status(code) { this._code = code; return this; },
      json(obj) {
        res.writeHead(this._code, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(obj));
      },
    };

    try {
      await handler(mockReq, mockRes);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  });
});

const PORT = process.env.PORT || 8060;
server.listen(PORT, () => {
  console.log(`email-bridge is listening on port ${PORT}`);
});
