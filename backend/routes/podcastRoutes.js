const express = require('express');
const router = express.Router();
const PodcastGuest = require('../models/PodcastGuest');
const nodemailer = require('nodemailer');

// ── Email transporter (configured via .env) ──
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

// ── Send admin notification email ──
const sendAdminEmail = async (guest) => {
  const transporter = createTransporter();
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

  const emailBody = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 0;">
      <div style="background: #000; padding: 24px 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px;">🎙️ NEW PODCAST GUEST REQUEST</h1>
      </div>
      <div style="padding: 32px; background: #fff; border: 1px solid #e5e7eb;">
        <p style="color: #374151; margin: 0 0 24px; font-size: 15px;">A new podcast guest has registered on <strong>Industrial Times</strong>. Review the details below:</p>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px 0; color: #6b7280; font-weight: 600; width: 140px;">Name</td>
            <td style="padding: 12px 0; color: #111827; font-weight: 700;">${guest.firstName} ${guest.lastName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Email</td>
            <td style="padding: 12px 0; color: #111827;"><a href="mailto:${guest.email}" style="color: #da251d;">${guest.email}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Phone</td>
            <td style="padding: 12px 0; color: #111827;">${guest.phone}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Website</td>
            <td style="padding: 12px 0; color: #111827;">${guest.website || 'N/A'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Availability</td>
            <td style="padding: 12px 0; color: #111827; font-weight: 700;">${guest.earliestAvailability}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #6b7280; font-weight: 600; vertical-align: top;">Background</td>
            <td style="padding: 12px 0; color: #111827; line-height: 1.6;">${guest.background}</td>
          </tr>
        </table>
      </div>
      <div style="padding: 20px 32px; background: #f3f4f6; text-align: center; border-top: 2px solid #da251d;">
        <p style="margin: 0; color: #6b7280; font-size: 12px;">Login to the <strong>SuperAdmin Dashboard</strong> to approve or reject this request.</p>
      </div>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Industrial Times Podcast" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: `🎙️ New Podcast Guest: ${guest.firstName} ${guest.lastName}`,
        html: emailBody
      });
      console.log(`✅ Podcast notification email sent to ${adminEmail}`);
    } catch (err) {
      console.error('❌ Email send failed:', err.message);
    }
  } else {
    console.log('──────────────────────────────────────────');
    console.log('📧 PODCAST GUEST NOTIFICATION (console fallback)');
    console.log(`   Name:  ${guest.firstName} ${guest.lastName}`);
    console.log(`   Email: ${guest.email}`);
    console.log(`   Phone: ${guest.phone}`);
    console.log(`   Avail: ${guest.earliestAvailability}`);
    console.log('──────────────────────────────────────────');
  }
};

// ═══════════════════════════════════════
//  PUBLIC: Submit podcast guest form
// ═══════════════════════════════════════
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, website, background, earliestAvailability } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email || !phone || !background || !earliestAvailability) {
      return res.status(400).json({ error: 'All required fields must be filled.' });
    }

    const guest = await PodcastGuest.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      website: website ? website.trim() : '',
      background: background.trim(),
      earliestAvailability
    });

    // Send email notification (non-blocking)
    sendAdminEmail(guest).catch(console.error);

    res.status(201).json({ message: 'Your podcast guest application has been submitted successfully!', guest });
  } catch (err) {
    console.error('Podcast submit error:', err);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

// ═══════════════════════════════════════
//  ADMIN: Get all podcast submissions
// ═══════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    const guests = await PodcastGuest.findAll({ order: [['createdAt', 'DESC']] });
    res.json(guests);
  } catch (err) {
    console.error('Podcast fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch podcast guests.' });
  }
});

// ═══════════════════════════════════════
//  ADMIN: Get pending count for badge
// ═══════════════════════════════════════
router.get('/pending-count', async (req, res) => {
  try {
    const count = await PodcastGuest.count({ where: { status: 'pending' } });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch count.' });
  }
});

// ═══════════════════════════════════════
//  ADMIN: Update guest status
// ═══════════════════════════════════════
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const guest = await PodcastGuest.findByPk(req.params.id);
    if (!guest) return res.status(404).json({ error: 'Guest not found.' });

    guest.status = status;
    await guest.save();

    res.json({ message: `Guest ${status} successfully.`, guest });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

// ═══════════════════════════════════════
//  ADMIN: Delete a guest submission
// ═══════════════════════════════════════
router.delete('/:id', async (req, res) => {
  try {
    const guest = await PodcastGuest.findByPk(req.params.id);
    if (!guest) return res.status(404).json({ error: 'Guest not found.' });

    await guest.destroy();
    res.json({ message: 'Guest deleted successfully.' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete guest.' });
  }
});

module.exports = router;
