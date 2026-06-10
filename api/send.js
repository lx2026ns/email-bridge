const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers['authorization'];
  if (token !== 'Bearer ' + process.env.AUTH_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { to, subject, content, replyTo } = req.body;

  if (!to || !subject || !content) {
    return res.status(400).json({ error: 'Missing to, subject, or content' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.163.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_ADDRESS,
      to: to,
      subject: subject,
      text: content
    };

    if (replyTo) {
      mailOptions.inReplyTo = replyTo;
      mailOptions.references = replyTo;
    }

    const info = await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      messageId: info.messageId,
      to: to,
      subject: subject
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
