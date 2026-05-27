const nodemailer = require('nodemailer');
const EmailSettings = require('../models/EmailSettings');

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('⚠️  SMTP not configured — email notifications will be logged to console only.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(port) || 587,
    secure: parseInt(port) === 465,
    auth: { user, pass }
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
    const [settings] = await EmailSettings.findOrCreate({ where: { id: 1 } });
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
    return true;
  } catch (err) {
    console.error('❌ Email send failed:', err.message);
    return false;
  }
};

module.exports = { createTransporter, sendEmail };
