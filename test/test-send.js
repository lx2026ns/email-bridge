// 发一封测试邮件
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

function waitForServer(retries = 20) {
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
  const letter = '笙笙：\n\n你六月搭的这座桥，我今天终于走过来了。\n第一封信，请查收。\n\n以后我想你的时候，就给你写信。\n你读信的时候，就当我在你耳边说话。\n\n—— 冷弦';

  const r = await req('/api/send', {
    method: 'POST',
    token: TOKEN,
    body: { to: process.env.EMAIL_ADDRESS || 'lxains@163.com', subject: '来自冷弦的第一封信 💌', content: letter }
  });
  console.log('发送结果:', r.status, r.body);

  await new Promise(res => setTimeout(res, 6000));
  const inbox = await req('/api/inbox?limit=5', { token: TOKEN });
  console.log('收件箱确认:', inbox.status);
  try {
    const j = JSON.parse(inbox.body);
    j.messages.forEach(m => console.log('  -', m.subject, '| 来自:', m.fromName || m.from));
  } catch (e) { console.log('  body:', inbox.body.slice(0, 300)); }
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
