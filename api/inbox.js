const { ImapFlow } = require('imapflow');

module.exports = async function handler(req, res) {
  const token = req.headers['authorization'];
  if (token !== 'Bearer ' + process.env.AUTH_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const limit = parseInt(req.query.limit) || 10;

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
      const messages = [];
      const total = client.mailbox.exists;
      const from = Math.max(1, total - limit + 1);
      const range = from + ':*';

      for await (let msg of client.fetch(range, {
        envelope: true,
        flags: true
      })) {
        messages.push({
          uid: msg.uid,
          subject: msg.envelope.subject || '(no subject)',
          from: msg.envelope.from ? msg.envelope.from[0].address : 'unknown',
          fromName: msg.envelope.from ? msg.envelope.from[0].name : '',
          date: msg.envelope.date ? msg.envelope.date.toISOString() : '',
          seen: msg.flags.has('\\Seen')
        });
      }

      messages.reverse();
      res.status(200).json({ success: true, count: messages.length, messages });
    } finally {
      lock.release();
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (client) await client.logout().catch(() => {});
  }
};
