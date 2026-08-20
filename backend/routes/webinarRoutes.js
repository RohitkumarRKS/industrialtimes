const express = require('express');
const router = express.Router();
const Webinar = require('../models/Webinar');
const WebinarRegistration = require('../models/WebinarRegistration');
const PlatformSettings = require('../models/PlatformSettings');
const { sendEmail } = require('../utils/email');
const { protect, authorize } = require('../middleware/auth');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_SwnZMgoy1Uy9zu',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 't5kJZ3LPJHViA8G4D1qH0bb7'
});

// Helper to slugify text for URL matching
const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

// Helper to find webinar by primary key (ID) or slugified title
const findWebinarByIdOrSlug = async (identifier) => {
  if (!identifier) return null;
  if (!isNaN(identifier)) {
    const webinar = await Webinar.findByPk(identifier);
    if (webinar) return webinar;
  }
  const webinars = await Webinar.findAll({ attributes: ['id', 'title'] });
  const found = webinars.find(w => slugify(w.title) === slugify(identifier));
  if (found) {
    return await Webinar.findByPk(found.id);
  }
  return null;
};

// ── PUBLIC: Fetch all webinars ──
router.get('/', async (req, res) => {
  try {
    const webinars = await Webinar.findAll({
      order: [['dateTime', 'ASC']]
    });
    res.json(webinars);
  } catch (err) {
    console.error('Fetch webinars error:', err);
    res.status(500).json({ error: 'Failed to fetch webinars' });
  }
});

// ── PUBLIC: Fetch details of a single webinar ──
router.get('/:id', async (req, res) => {
  try {
    const webinar = await findWebinarByIdOrSlug(req.params.id);
    if (!webinar) {
      return res.status(404).json({ error: 'Webinar not found' });
    }
    res.json(webinar);
  } catch (err) {
    console.error('Fetch webinar details error:', err);
    res.status(500).json({ error: 'Failed to fetch webinar details' });
  }
});

// ── PUBLIC: Register for a Free Webinar ──
router.post('/:id/register', async (req, res) => {
  try {
    const webinar = await findWebinarByIdOrSlug(req.params.id);
    if (!webinar) {
      return res.status(404).json({ error: 'Webinar not found' });
    }

    if (webinar.isPaymentEnabled) {
      return res.status(400).json({ error: 'This webinar requires Razorpay payment checkout.' });
    }

    const { name, email, phone, company, designation } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Name, Email, and Phone are required.' });
    }

    const registration = await WebinarRegistration.create({
      webinarId: webinar.id,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      company: company ? company.trim() : '',
      designation: designation ? designation.trim() : '',
      paymentStatus: 'completed',
      transactionId: 'FREE_ENTRY'
    });

    // Send confirmation email
    const emailContent = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border: 1px solid #e5e7eb;">
        <h2 style="color: #da251d;">Webinar Registration Received</h2>
        <p>Dear ${name},</p>
        <p>Thank you for registering for our upcoming webinar: <strong>${webinar.title}</strong>.</p>
        <p><strong>Speaker:</strong> ${webinar.speaker}</p>
        <p><strong>Date & Time:</strong> ${new Date(webinar.dateTime).toLocaleString()}</p>
        <br/>
        <p>Your registration is confirmed. We will share the joining instructions before the session starts.</p>
        ${webinar.meetingLink ? `<p><strong>Access Link:</strong> <a href="${webinar.meetingLink}" style="color: #da251d; font-weight: bold;">Join Webinar Here</a></p>` : ''}
        <br/>
        <p>Best regards,</p>
        <p><strong>Industrial Times Team</strong></p>
      </div>
    `;

    await sendEmail(email.trim(), `Registration Confirmed: ${webinar.title}`, emailContent);

    res.status(201).json({ message: 'Registration submitted successfully!', registration });
  } catch (err) {
    console.error('Webinar registration error:', err);
    res.status(500).json({ error: 'Failed to submit registration. Please try again.' });
  }
});

// ── PUBLIC: Create Razorpay Order for a Webinar ──
router.post('/:id/create-razorpay-order', async (req, res) => {
  try {
    const webinar = await findWebinarByIdOrSlug(req.params.id);
    if (!webinar) {
      return res.status(404).json({ error: 'Webinar not found' });
    }

    const { promoCode } = req.body;
    const gstRate = parseFloat(await PlatformSettings.getSetting('webinar_gst_rate', '18'));
    const entryFee = webinar.entryFee !== undefined && webinar.entryFee !== null ? parseFloat(webinar.entryFee) : 99;
    let finalAmount = Math.round(entryFee * (1 + gstRate / 100)); // Base Fee + GST

    if (promoCode) {
      const PromoCode = require('../models/PromoCode');
      const promo = await PromoCode.findOne({ where: { code: promoCode.trim().toUpperCase() } });
      if (promo && promo.isActive) {
        const now = new Date();
        const isStarted = !promo.startDate || new Date(promo.startDate) <= now;
        const isNotExpired = !promo.endDate || new Date(promo.endDate) >= now;
        const hasUsesLeft = promo.maxUses === null || promo.usedCount < promo.maxUses;
        const isApplicable = promo.applicableTo === 'all' || promo.applicableTo === 'webinar';
        const isAboveMin = finalAmount >= parseFloat(promo.minOrderAmount);

        if (isStarted && isNotExpired && hasUsesLeft && isApplicable && isAboveMin) {
          let discount = 0.00;
          if (promo.discountType === 'percentage') {
            discount = finalAmount * (parseFloat(promo.discountValue) / 100);
          } else {
            discount = parseFloat(promo.discountValue);
          }
          finalAmount = Math.max(0, Math.round(finalAmount - discount));
        }
      }
    }

    const amount = finalAmount * 100; // In paise

    if (amount === 0) {
      return res.json({ id: 'FREE_ENTRY_' + Date.now(), amount: 0, currency: "INR" });
    }

    const options = {
      amount,
      currency: "INR",
      receipt: `web_rcpt_${webinar.id}_${Date.now()}`,
      notes: {
        webinarId: String(webinar.id),
        promoCode: String(promoCode || '')
      }
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Razorpay Webinar Order Error:", error);
    const detail = error?.error?.description || error?.description || error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
    res.status(500).json({ error: `Could not create Razorpay order for webinar: ${detail}` });
  }
});

// ── PUBLIC: Verify Razorpay Payment and Register ──
router.post('/:id/verify-payment', async (req, res) => {
  try {
    const webinar = await findWebinarByIdOrSlug(req.params.id);
    if (!webinar) {
      return res.status(404).json({ error: 'Webinar not found' });
    }

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      name,
      email,
      phone,
      company,
      designation,
      promoCode
    } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Name, Email, and Phone are required.' });
    }

    // Verify signature & Increment usedCount if coupon applied
    let is100PercentDiscount = false;
    if (promoCode) {
      const PromoCode = require('../models/PromoCode');
      const promo = await PromoCode.findOne({ where: { code: promoCode.trim().toUpperCase() } });
      if (promo && promo.isActive) {
        const now = new Date();
        const isStarted = !promo.startDate || new Date(promo.startDate) <= now;
        const isNotExpired = !promo.endDate || new Date(promo.endDate) >= now;
        const hasUsesLeft = promo.maxUses === null || promo.usedCount < promo.maxUses;
        const isApplicable = promo.applicableTo === 'all' || promo.applicableTo === 'webinar';
        const entryFee = webinar.entryFee !== undefined && webinar.entryFee !== null ? webinar.entryFee : 99;
        const gstRate = parseFloat(await PlatformSettings.getSetting('webinar_gst_rate', '18'));
        const originalTotal = Math.round(entryFee * (1 + gstRate / 100));
        const isAboveMin = originalTotal >= parseFloat(promo.minOrderAmount);

        if (isStarted && isNotExpired && hasUsesLeft && isApplicable && isAboveMin) {
          let discount = 0.00;
          if (promo.discountType === 'percentage') {
            discount = originalTotal * (parseFloat(promo.discountValue) / 100);
          } else {
            discount = parseFloat(promo.discountValue);
          }
          if (originalTotal - discount <= 0) {
            is100PercentDiscount = true;
          }

          promo.usedCount += 1;
          await promo.save();
        }
      }
    }

    if (!is100PercentDiscount) {
      const sign = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSign = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 't5kJZ3LPJHViA8G4D1qH0bb7')
        .update(sign.toString())
        .digest("hex");

      if (razorpay_signature !== expectedSign) {
        return res.status(400).json({ error: "Invalid payment signature" });
      }
    }

    // Save registration with status 'completed'
    const registration = await WebinarRegistration.create({
      webinarId: webinar.id,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      company: company ? company.trim() : '',
      designation: designation ? designation.trim() : '',
      paymentStatus: 'completed',
      transactionId: razorpay_payment_id
    });

    // Send payment success & confirmation email
    const emailContent = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border: 1px solid #e5e7eb;">
        <h2 style="color: #4caf50;">Payment Verified & Registration Confirmed!</h2>
        <p>Hi ${name},</p>
        <p>We have successfully verified your payment for the webinar: <strong>${webinar.title}</strong>.</p>
        <p>We will send the webinar joining link to join soon.</p>
        ${webinar.meetingLink ? `<p><strong>Meeting Access Link:</strong> <a href="${webinar.meetingLink}" style="color: #da251d;">Join Session Here</a></p>` : ''}
        <br/>
        <p>Best regards,</p>
        <p><strong>Industrial Times Team</strong></p>
      </div>
    `;

    await sendEmail(email.trim(), `Payment Confirmed: ${webinar.title}`, emailContent);

    // Send notification to Admin
    try {
      const EmailSettings = require('../models/EmailSettings');
      let adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
      const settings = await EmailSettings.findOne();
      if (settings && settings.adminEmail) adminEmail = settings.adminEmail;

      if (adminEmail) {
        const adminContent = `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border: 1px solid #e5e7eb;">
            <h2 style="color: #da251d;">🎉 New Webinar Registration Payment</h2>
            <p>A new payment registration has been received for <strong>${webinar.title}</strong>.</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <tr><td style="padding: 6px 0; font-weight: bold;">Name:</td><td>${name}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Email:</td><td>${email}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Phone:</td><td>${phone}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Company:</td><td>${company || 'N/A'}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Transaction ID:</td><td>${razorpay_payment_id || 'FREE_ENTRY'}</td></tr>
            </table>
          </div>
        `;
        sendEmail(adminEmail, `🔔 New Webinar Registration: ${name}`, adminContent).catch(console.error);
      }
    } catch (adminEmailErr) {
      console.error('Failed to send admin webinar notification:', adminEmailErr);
    }

    res.json({ message: "Registration and payment verified successfully", registration });
  } catch (error) {
    console.error("Webinar Payment Verification Error:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

// ── ADMIN PROTECTED ROUTES ──

// Create Webinar
router.post('/', protect, authorize('superadmin', 'webinars'), async (req, res) => {
  try {
    const { title, description, speaker, dateTime, dateTimeEnd, videoUrl, paymentButtonText, paymentLink, isPaymentEnabled, entryFee, meetingLink, schedule, whatsAppGroupLink, isActive, isRecordedVideo } = req.body;
    if (!title || !dateTime) {
      return res.status(400).json({ error: 'Title and Date/Time are required.' });
    }

    const webinar = await Webinar.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      speaker: speaker ? speaker.trim() : '',
      dateTime,
      dateTimeEnd: dateTimeEnd || null,
      schedule: schedule ? (typeof schedule === 'string' ? schedule : JSON.stringify(schedule)) : '[]',
      videoUrl: videoUrl || '',
      paymentButtonText: paymentButtonText || 'Pay Registration Fee',
      paymentLink: paymentLink || '',
      isPaymentEnabled: isPaymentEnabled !== undefined ? isPaymentEnabled : true,
      entryFee: entryFee !== undefined ? parseFloat(entryFee) : 99.00,
      meetingLink: meetingLink || '',
      whatsAppGroupLink: whatsAppGroupLink || '',
      isActive: isActive !== undefined ? isActive : true,
      isRecordedVideo: isRecordedVideo !== undefined ? isRecordedVideo : false
    });
    res.status(201).json(webinar);
  } catch (err) {
    console.error('Create webinar error:', err);
    res.status(500).json({ error: 'Failed to create webinar.' });
  }
});

// Update Webinar
router.put('/:id', protect, authorize('superadmin', 'webinars'), async (req, res) => {
  try {
    const webinar = await findWebinarByIdOrSlug(req.params.id);
    if (!webinar) {
      return res.status(404).json({ error: 'Webinar not found' });
    }
    
    // Clean up empty date strings to prevent database validation errors
    const updateData = { ...req.body };
    if (updateData.dateTime === '') {
      delete updateData.dateTime;
    }
    if (updateData.dateTimeEnd === '') {
      updateData.dateTimeEnd = null;
    }
    if (updateData.schedule && typeof updateData.schedule !== 'string') {
      updateData.schedule = JSON.stringify(updateData.schedule);
    }
    
    await webinar.update(updateData);
    res.json(webinar);
  } catch (err) {
    console.error('Update webinar error:', err);
    res.status(500).json({ error: 'Failed to update webinar.' });
  }
});

// Delete Webinar
router.delete('/:id', protect, authorize('superadmin', 'webinars'), async (req, res) => {
  try {
    const webinar = await findWebinarByIdOrSlug(req.params.id);
    if (!webinar) {
      return res.status(404).json({ error: 'Webinar not found' });
    }
    await webinar.destroy();
    res.json({ message: 'Webinar deleted successfully.' });
  } catch (err) {
    console.error('Delete webinar error:', err);
    res.status(500).json({ error: 'Failed to delete webinar.' });
  }
});

// Fetch Registrants for a Webinar
router.get('/:id/registrants', protect, authorize('superadmin', 'webinars'), async (req, res) => {
  try {
    const webinar = await findWebinarByIdOrSlug(req.params.id);
    if (!webinar) {
      return res.status(404).json({ error: 'Webinar not found' });
    }
    const registrants = await WebinarRegistration.findAll({
      where: { webinarId: webinar.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(registrants);
  } catch (err) {
    console.error('Fetch registrants error:', err);
    res.status(500).json({ error: 'Failed to fetch registrants.' });
  }
});

// Update Registrant Payment Status
router.put('/registrants/:regId', protect, authorize('superadmin', 'webinars'), async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const registration = await WebinarRegistration.findByPk(req.params.regId);
    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    registration.paymentStatus = paymentStatus;
    await registration.save();

    if (paymentStatus === 'completed') {
      const webinar = await Webinar.findByPk(registration.webinarId);
      const emailContent = `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border: 1px solid #e5e7eb;">
          <h2 style="color: #4caf50;">Payment Verified & Registration Confirmed!</h2>
          <p>Hi ${registration.name},</p>
          <p>We have successfully verified your payment for the webinar: <strong>${webinar.title}</strong>.</p>
          <p>We will send the webinar joining link to join soon.</p>
          ${webinar.meetingLink ? `<p><strong>Meeting Access Link:</strong> <a href="${webinar.meetingLink}" style="color: #da251d;">Join Session Here</a></p>` : ''}
          <br/>
          <p>Best regards,</p>
          <p><strong>Industrial Times Team</strong></p>
        </div>
      `;
      await sendEmail(registration.email, `Payment Confirmed: ${webinar.title}`, emailContent);
    }

    res.json({ message: 'Registrant status updated successfully.', registration });
  } catch (err) {
    console.error('Update registrant status error:', err);
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

// Email Blast to Registrants
router.post('/:id/email-blast', protect, authorize('superadmin', 'webinars'), async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and Message are required.' });
    }

    const webinar = await findWebinarByIdOrSlug(req.params.id);
    if (!webinar) {
      return res.status(404).json({ error: 'Webinar not found' });
    }

    const registrants = await WebinarRegistration.findAll({
      where: { webinarId: webinar.id }
    });

    if (registrants.length === 0) {
      return res.status(400).json({ error: 'No registrants found for this webinar.' });
    }

    const formattedMessage = message.replace(/\n/g, '<br/>');

    for (const reg of registrants) {
      const emailContent = `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border: 1px solid #e5e7eb;">
          <p>Dear ${reg.name},</p>
          <div>${formattedMessage}</div>
          <br/>
          <p>Best regards,</p>
          <p><strong>Industrial Times Team</strong></p>
        </div>
      `;
      sendEmail(reg.email, subject, emailContent).catch(console.error);
    }

    res.json({ message: `Successfully queued email blast to ${registrants.length} registrants.` });
  } catch (err) {
    console.error('Email blast error:', err);
    res.status(500).json({ error: 'Failed to send email blast.' });
  }
});

module.exports = router;

