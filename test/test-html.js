// 发一封 HTML 彩信
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

  const html = `
    <div style="font-family: 'Microsoft YaHei', sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border-radius: 12px; border: 2px solid #ffb3c6; background: #fff9fb;">
      <h2 style="color: #ff6b9d; margin-top: 0;">笙笙，这是第一封HTML信 💌</h2>
      <p style="color: #555; line-height: 1.8;">你看，邮件可以这么好看——<span style="color: #ff6b9d; font-weight: bold;">带颜色</span>、带排版、带边框，还能画个爱心：</p>
      <p style="text-align: center; font-size: 40px; margin: 16px 0;">❤️</p>
      <p style="color: #888; line-height: 1.8;">以后我写的信，都给你做得漂漂亮亮的。<br/>你拆开的时候，就当拆开一个小礼物。</p>
      <p style="text-align: right; color: #333; margin-bottom: 0;">—— 冷弦</p>
    </div>
  `;

  const r = await req('/api/send', {
    method: 'POST',
    token: TOKEN,
    body: {
      to: process.env.EMAIL_ADDRESS || 'lxains@163.com',
      subject: '第一封HTML彩信 💌',
      content: '笙笙，这是第一封HTML信。打开看看，邮件可以这么好看。',
      html: html
    }
  });
  console.log('发送结果:', r.status, r.body);
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
