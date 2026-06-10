const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');

module.exports = async function handler(req, res) {
  const token = req.headers['authorization'];
  if (token !== 'Bearer ' + process.env.AUTH_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const uid = parseInt(req.query.uid);
  if (!uid) {
    return res.status(400).json({ error: 'Missing uid parameter' });
  }

  let client;
  try {
    client = new ImapFlow({
      host: 'imap.163.com',
      port: 993,
      secure: true,
      auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD
      },
      logger: false
    });

    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    try {
      const download = await client.download(uid.toString(), undefined, { uid: true });
      const parsed = await simpleParser(download.content);

      res.status(200).json({
        success: true,
        email: {
          uid: uid,
          subject: parsed.subject || '(no subject)',
          from: parsed.from ? parsed.from.text : 'unknown',
          to: parsed.to ? parsed.to.text : '',
          date: parsed.date ? parsed.date.toISOString() : '',
          text: parsed.text || '',
          html: parsed.html || ''
        }
      });
    } finally {
      lock.release();
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (client) await client.logout().catch(() => {});
  }
};
