// email-bridge 测试脚本
const http = require('http');
const TOKEN = process.env.AUTH_TOKEN || '';

function req(path, opts = {}) {
  return new Promise((resolve, reject) => {
    const data = opts.body ? JSON.stringify(opts.body) : null;
    const u = new URL('http://127.0.0.1:8060' + path);
    const r = http.request(u, {
      method: opts.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(opts.token ? { Authorization: 'Bearer ' + opts.token } : {})
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

function waitForServer(retries = 15) {
  return new Promise((resolve, reject) => {
    const tryOnce = (n) => {
      const r = http.request('http://127.0.0.1:8060/api/inbox', (res) => {
        res.resume();
        resolve();
      });
      r.on('error', () => {
        if (n <= 0) return reject(new Error('server not ready'));
        setTimeout(() => tryOnce(n - 1), 500);
      });
      r.end();
    };
    tryOnce(retries);
  });
}

(async () => {
  await waitForServer();
  // 1. 无令牌 → 应该 401
  let r = await req('/api/inbox');
  console.log('[1] 无token:', r.status, r.body);

  // 2. 带令牌查收件箱 → 应该 200
  r = await req('/api/inbox?limit=3', { token: TOKEN });
  console.log('[2] inbox:', r.status);
  try {
    const j = JSON.parse(r.body);
    console.log('    邮件数:', j.count);
    if (j.messages && j.messages.length) {
      j.messages.forEach(m => console.log('    -', m.fromName || m.from, '|', m.subject, '|', m.date));
    }
  } catch (e) { console.log('    body:', r.body.slice(0, 200)); }
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
