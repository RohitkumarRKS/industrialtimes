const nodemailer = require('nodemailer');
const EmailSettings = require('../models/EmailSettings');
const EmailLog = require('../models/EmailLog');

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('⚠️  SMTP not configured — email notifications will be logged to console only.');
    return null;
  }

  console.log(`📧 Creating SMTP transporter: host=${host}, port=${port}, user=${user}`);

  return nodemailer.createTransport({
    host,
    port: parseInt(port) || 465,
    secure: parseInt(port) === 465,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
};

const sendEmail = async (to, subject, htmlContent) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('──────────────────────────────────────────');
    console.log('📧 MOCK EMAIL SENT (console fallback)');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Content: ${htmlContent}`);
    console.log('──────────────────────────────────────────');
    return false;
  }

  let adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  try {
    const settings = await EmailSettings.findOne();
    if (settings && settings.adminEmail) {
      adminEmail = settings.adminEmail;
    }
  } catch (e) {
    console.error("Could not fetch email settings", e);
  }

  try {
    await transporter.sendMail({
      from: `"Industrial Times" <${process.env.SMTP_USER}>`,
      to,
      replyTo: adminEmail,
      subject,
      html: htmlContent
    });
    console.log(`✅ Email sent successfully to ${to}`);
    try {
      await EmailLog.create({
        toEmail: to,
        subject,
        status: 'sent',
        type: 'system_notification'
      });
    } catch (logErr) {
      console.error('Failed to create EmailLog record:', logErr.message);
    }
    return true;
  } catch (err) {
    console.error('❌ Email send failed:', err.message);
    try {
      await EmailLog.create({
        toEmail: to,
        subject,
        status: 'failed',
        errorMessage: err.message,
        type: 'system_notification'
      });
    } catch (logErr) {
      console.error('Failed to create EmailLog record:', logErr.message);
    }
    return false;
  }
};

module.exports = { createTransporter, sendEmail };
