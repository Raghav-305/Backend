const sendgrid = require('@sendgrid/mail');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');
const dataService = require('../services/dataService');

if (process.env.SENDGRID_API_KEY) {
  sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
}

exports.handleContact = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      ok: false,
      error: 'Validation failed',
      errors: errors.array(),
    });
  }

  const {
    name,
    email,
    phone = '',
    city = '',
    eventType = '',
    budget = '',
    message,
    subject,
  } = req.body;

  const payload = {
    name,
    email,
    phone,
    city,
    eventType,
    budget,
    subject: subject || 'Website contact',
    message,
    date: new Date().toISOString(),
  };

  // Try SendGrid
  if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM) {
    try {
      await sendgrid.send({
        to: process.env.SENDGRID_TO || process.env.SENDGRID_FROM,
        from: process.env.SENDGRID_FROM,
        subject: `${payload.subject} — ${payload.name}`,
        text: `${payload.message}\n\nFrom: ${payload.name} <${payload.email}>`,
        html: `<p>${payload.message}</p><hr/><p>From: ${payload.name} &lt;${payload.email}&gt;</p>`,
      });

      const contacts = dataService.readJSON('contacts.json', []);
      contacts.unshift(payload);
      dataService.writeJSON('contacts.json', contacts);

      return res.status(200).json({ ok: true, method: 'sendgrid', message: 'Contact submitted successfully' });
    } catch (err) {
      console.error('SendGrid error:', err?.message || err);
    }
  }

  // Try SMTP if configured
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: process.env.SMTP_TO || process.env.SMTP_FROM || process.env.SMTP_USER,
        subject: `${payload.subject} — ${payload.name}`,
        text: `${payload.message}\n\nFrom: ${payload.name} <${payload.email}>`,
      });

      const contacts = dataService.readJSON('contacts.json', []);
      contacts.unshift(payload);
      dataService.writeJSON('contacts.json', contacts);

      return res.status(200).json({ ok: true, method: 'smtp', message: 'Contact submitted successfully' });
    } catch (err) {
      console.error('SMTP error:', err?.message || err);
    }
  }

  // Fallback: write to local contacts.json
  try {
    const contacts = dataService.readJSON('contacts.json', []);
    contacts.unshift(payload);
    dataService.writeJSON('contacts.json', contacts);
    return res.status(200).json({ ok: true, method: 'file', message: 'Contact submitted successfully' });
  } catch (err) {
    console.error('Write fallback error:', err);
    return res.status(500).json({ ok: false, error: 'Unable to process contact' });
  }
};
