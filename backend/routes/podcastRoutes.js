const express = require('express');
const router = express.Router();
const PodcastGuest = require('../models/PodcastGuest');
const PodcastFormField = require('../models/PodcastFormField');
const PodcastEpisode = require('../models/PodcastEpisode');
const EmailLog = require('../models/EmailLog');
const EmailSettings = require('../models/EmailSettings');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

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

// ── Generate PDF Buffer ──
const createPDFBuffer = (guest) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      let buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        let pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc.fontSize(24).fillColor('#da251d').text('Industrial Times Podcast', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(16).fillColor('#000000').text('Guest Application Form', { align: 'center' });
      doc.moveDown(2);

      // Details
      doc.fontSize(12).fillColor('#333333');
      doc.text('First Name: ', { continued: true }).fillColor('#000000').text(guest.firstName);
      doc.moveDown(0.5);
      doc.fillColor('#333333').text('Last Name: ', { continued: true }).fillColor('#000000').text(guest.lastName);
      doc.moveDown(0.5);
      doc.fillColor('#333333').text('Email: ', { continued: true }).fillColor('#000000').text(guest.email);
      doc.moveDown(0.5);
      doc.fillColor('#333333').text('Phone: ', { continued: true }).fillColor('#000000').text(guest.phone);
      doc.moveDown(0.5);
      doc.fillColor('#333333').text('Website: ', { continued: true }).fillColor('#000000').text(guest.website || 'N/A');
      doc.moveDown(1.5);

      if (guest.customData && Object.keys(guest.customData).length > 0) {
        doc.fontSize(14).fillColor('#da251d').text('Additional Information');
        doc.moveDown(0.5);
        doc.fontSize(12);
        for (const [key, value] of Object.entries(guest.customData)) {
          doc.fillColor('#333333').text(`${key}: `, { continued: true }).fillColor('#000000').text(value);
          doc.moveDown(0.5);
        }
        doc.moveDown(1);
      }

      // Background
      doc.fontSize(14).fillColor('#da251d').text('Background & Topic Idea');
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#000000').text(guest.background, { align: 'justify' });

      // Footer
      doc.moveDown(3);
      doc.fontSize(10).fillColor('#888888').text(`Submitted on: ${new Date().toLocaleString()}`, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// ── Send admin notification email ──
const sendAdminEmail = async (guest) => {
  const transporter = createTransporter();
  let adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  
  try {
    const [settings] = await EmailSettings.findOrCreate({ where: { id: 1 } });
    if (settings && settings.adminEmail) {
      adminEmail = settings.adminEmail;
    }
  } catch (e) {
    console.error("Could not fetch email settings", e);
  }

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
          ${guest.customData ? Object.entries(guest.customData).map(([k, v]) => `
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">${k}</td>
            <td style="padding: 12px 0; color: #111827;">${v}</td>
          </tr>`).join('') : ''}
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
        replyTo: guest.email,
        subject: `🎙️ New Podcast Guest: ${guest.firstName} ${guest.lastName}`,
        html: emailBody,
        attachments: [
          {
            filename: `${guest.firstName}_${guest.lastName}_Application.pdf`,
            content: await createPDFBuffer(guest),
            contentType: 'application/pdf'
          }
        ]
      });
      console.log(`✅ Podcast notification email sent to ${adminEmail}`);
      
      await EmailLog.create({
        toEmail: adminEmail,
        subject: `🎙️ New Podcast Guest: ${guest.firstName} ${guest.lastName}`,
        status: 'sent',
        type: 'podcast_admin_notification'
      });
    } catch (err) {
      console.error('❌ Email send failed:', err.message);
      await EmailLog.create({
        toEmail: adminEmail,
        subject: `🎙️ New Podcast Guest: ${guest.firstName} ${guest.lastName}`,
        status: 'failed',
        errorMessage: err.message,
        type: 'podcast_admin_notification'
      });
    }
  } else {
    console.log('──────────────────────────────────────────');
    console.log('📧 PODCAST GUEST NOTIFICATION (console fallback)');
    console.log(`   Name:  ${guest.firstName} ${guest.lastName}`);
    console.log(`   Email: ${guest.email}`);
    console.log(`   Phone: ${guest.phone}`);
    console.log('──────────────────────────────────────────');
  }
};

// ── Send user confirmation email ──
const sendUserConfirmationEmail = async (guest) => {
  const transporter = createTransporter();
  
  let adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  try {
    const [settings] = await EmailSettings.findOrCreate({ where: { id: 1 } });
    if (settings && settings.adminEmail) {
      adminEmail = settings.adminEmail;
    }
  } catch (e) { }

  const emailBody = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px;">
      <h2 style="color: #da251d;">Thank You for Your Application!</h2>
      <p>Hi ${guest.firstName},</p>
      <p>We have successfully received your application to be a guest on the Industrial Times Podcast.</p>
      <p>Our team will review your background and topic ideas. We will get back to you shortly regarding the next steps.</p>
      <br/>
      <p>Best regards,</p>
      <p><strong>Industrial Times Team</strong></p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Industrial Times Podcast" <${process.env.SMTP_USER}>`,
        to: guest.email,
        replyTo: adminEmail,
        subject: `Your Podcast Application - Industrial Times`,
        html: emailBody,
        attachments: [
          {
            filename: `Your_Podcast_Application.pdf`,
            content: await createPDFBuffer(guest),
            contentType: 'application/pdf'
          }
        ]
      });
      
      await EmailLog.create({
        toEmail: guest.email,
        subject: `Your Podcast Application - Industrial Times`,
        status: 'sent',
        type: 'podcast_submission'
      });
    } catch (err) {
      console.error('❌ User email send failed:', err.message);
      await EmailLog.create({
        toEmail: guest.email,
        subject: `Your Podcast Application - Industrial Times`,
        status: 'failed',
        errorMessage: err.message,
        type: 'podcast_submission'
      });
    }
  }
};

// ═══════════════════════════════════════
//  PUBLIC: Submit podcast guest form
// ═══════════════════════════════════════
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, website, background, customData } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email || !phone || !background) {
      return res.status(400).json({ error: 'All required fields must be filled.' });
    }

    const guest = await PodcastGuest.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      website: website ? website.trim() : '',
      background: background.trim(),
      customData: customData || {}
    });

    // Send email notification (non-blocking)
    sendAdminEmail(guest).catch(console.error);
    sendUserConfirmationEmail(guest).catch(console.error);

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
//  PUBLIC/ADMIN: Form Fields API
// ═══════════════════════════════════════
router.get('/fields', async (req, res) => {
  try {
    const fields = await PodcastFormField.findAll({ order: [['order', 'ASC']] });
    res.json(fields);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch form fields.' });
  }
});

router.post('/fields', async (req, res) => {
  try {
    const field = await PodcastFormField.create(req.body);
    res.status(201).json(field);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/fields/:id', async (req, res) => {
  try {
    const field = await PodcastFormField.findByPk(req.params.id);
    if (!field) return res.status(404).json({ error: 'Field not found' });
    await field.update(req.body);
    res.json(field);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/fields/:id', async (req, res) => {
  try {
    const field = await PodcastFormField.findByPk(req.params.id);
    if (!field) return res.status(404).json({ error: 'Field not found' });
    await field.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

// ═══════════════════════════════════════
//  ADMIN: Reply to podcast guest
// ═══════════════════════════════════════
router.post('/:id/reply', async (req, res) => {
  try {
    const { subject, message } = req.body;
    
    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required.' });
    }

    const guest = await PodcastGuest.findByPk(req.params.id);
    if (!guest) return res.status(404).json({ error: 'Guest not found.' });

    const transporter = createTransporter();
    
    if (!transporter) {
      return res.status(500).json({ error: 'Email SMTP is not configured on the server.' });
    }

    let adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    let signature = '';
    try {
      const [settings] = await EmailSettings.findOrCreate({ where: { id: 1 } });
      if (settings) {
        adminEmail = settings.adminEmail || adminEmail;
        signature = settings.emailSignature || '';
      }
    } catch (e) { }

    const formattedMessage = message.replace(/\n/g, '<br/>');
    const formattedSignature = signature.replace(/\n/g, '<br/>');

    const emailBody = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px;">
        <p>${formattedMessage}</p>
        <br/><br/>
        <p>${formattedSignature}</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Industrial Times Podcast" <${process.env.SMTP_USER}>`,
      to: guest.email,
      replyTo: adminEmail,
      subject: subject,
      html: emailBody
    });

    await EmailLog.create({
      toEmail: guest.email,
      subject: subject,
      status: 'sent',
      type: 'podcast_reply'
    });

    res.json({ message: 'Reply sent successfully.' });
  } catch (err) {
    console.error('Reply error:', err);
    
    // Log failure if possible
    try {
      const guest = await PodcastGuest.findByPk(req.params.id);
      if (guest) {
        await EmailLog.create({
          toEmail: guest.email,
          subject: req.body.subject || 'Podcast Reply',
          status: 'failed',
          errorMessage: err.message,
          type: 'podcast_reply'
        });
      }
    } catch (e) { }
    
    res.status(500).json({ error: 'Failed to send reply. Please check SMTP settings.' });
  }
});

// ═══════════════════════════════════════
//  PUBLIC: Get all active podcast episodes
// ═══════════════════════════════════════
router.get('/episodes', async (req, res) => {
  try {
    const episodes = await PodcastEpisode.findAll({
      where: { active: true },
      order: [['publishedAt', 'DESC']]
    });
    res.json(episodes);
  } catch (err) {
    console.error('Episode fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch episodes.' });
  }
});

// ═══════════════════════════════════════
//  ADMIN: Get all podcast episodes (including inactive)
// ═══════════════════════════════════════
router.get('/episodes/all', async (req, res) => {
  try {
    const episodes = await PodcastEpisode.findAll({
      order: [['publishedAt', 'DESC']]
    });
    res.json(episodes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch episodes.' });
  }
});

// ═══════════════════════════════════════
//  ADMIN: Create a new podcast episode
// ═══════════════════════════════════════
router.post('/episodes', async (req, res) => {
  try {
    const { title, description, thumbnailUrl, audioUrl, duration, guestName, episodeNumber, publishedAt } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });

    const episode = await PodcastEpisode.create({
      title: title.trim(),
      description: (description || '').trim(),
      thumbnailUrl: thumbnailUrl || '',
      audioUrl: audioUrl || '',
      duration: duration || '',
      guestName: (guestName || '').trim(),
      episodeNumber: episodeNumber || null,
      publishedAt: publishedAt || new Date(),
      active: true
    });

    res.status(201).json(episode);
  } catch (err) {
    console.error('Episode create error:', err);
    res.status(500).json({ error: 'Failed to create episode.' });
  }
});

// ═══════════════════════════════════════
//  ADMIN: Update a podcast episode
// ═══════════════════════════════════════
router.put('/episodes/:id', async (req, res) => {
  try {
    const episode = await PodcastEpisode.findByPk(req.params.id);
    if (!episode) return res.status(404).json({ error: 'Episode not found.' });

    await episode.update(req.body);
    res.json(episode);
  } catch (err) {
    console.error('Episode update error:', err);
    res.status(500).json({ error: 'Failed to update episode.' });
  }
});

// ═══════════════════════════════════════
//  ADMIN: Delete a podcast episode
// ═══════════════════════════════════════
router.delete('/episodes/:id', async (req, res) => {
  try {
    const episode = await PodcastEpisode.findByPk(req.params.id);
    if (!episode) return res.status(404).json({ error: 'Episode not found.' });

    await episode.destroy();
    res.json({ message: 'Episode deleted successfully.' });
  } catch (err) {
    console.error('Episode delete error:', err);
    res.status(500).json({ error: 'Failed to delete episode.' });
  }
});

module.exports = router;
