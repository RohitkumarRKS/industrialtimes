const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendEmail } = require('../utils/email');
const { protect, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const PlatformSettings = require('../models/PlatformSettings');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder'
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { name, email, password, role, companyName, designation, phone, selectedPlan, bio, expertise, portfolio } = req.body;

  try {
    const userExists = await User.findOne({ where: { email } });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const isCorporate = role === 'corporate';
    const isReporter = role === 'author';

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
      status: isCorporate ? 'pending' : (isReporter ? 'payment_pending' : 'approved'),
      companyName: companyName || null,
      designation: designation || null,
      phone: phone || null,
      selectedPlan: selectedPlan || null,
      bio: bio || null,
      expertise: expertise || null,
      portfolio: portfolio || null
    });

    if (user) {
      if (isReporter) {
        // Send registration confirmation email
        const emailBody = `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h2 style="color: #da251d;">Reporter Registration Received!</h2>
            <p>Hi ${user.name},</p>
            <p>Thank you for registering as a Reporter on <strong>Industrial Times</strong>!</p>
            <p>To activate your account and start writing articles, a one-time registration fee is required.</p>
            <p>Please log in to your account to complete the payment and activate your dashboard.</p>
            <br/>
            <p>Best regards,</p>
            <p><strong>Industrial Times Team</strong></p>
          </div>
        `;
        sendEmail(user.email, "Complete Your Reporter Registration - Industrial Times", emailBody).catch(console.error);

        // Notify admin
        let adminEmail = process.env.ADMIN_EMAIL || 'info@industrialtimes.in';
        try {
          const EmailSettings = require('../models/EmailSettings');
          const settings = await EmailSettings.findOne();
          if (settings && settings.adminEmail) {
            adminEmail = settings.adminEmail;
          }
        } catch (e) { }

        const adminEmailBody = `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h2 style="color: #da251d;">New Reporter Registered (Payment Pending)</h2>
            <p>A new reporter account has been registered and is awaiting registration fee payment / manual approval:</p>
            <ul>
              <li><strong>Name:</strong> ${user.name}</li>
              <li><strong>Email:</strong> ${user.email}</li>
              <li><strong>Phone:</strong> ${user.phone || 'N/A'}</li>
              <li><strong>Expertise:</strong> ${user.expertise || 'N/A'}</li>
            </ul>
            <p>You can review and approve them directly from the admin panel to bypass the payment.</p>
            <br/>
            <a href="https://industrialtimes.in/superadmin@123" style="background: #da251d; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Go to Admin Panel</a>
          </div>
        `;
        sendEmail(adminEmail, "New Reporter Registration - Industrial Times", adminEmailBody).catch(console.error);

        res.status(201).json({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          token: null,
          message: 'Reporter account registered successfully! A one-time registration fee is required. Please log in to complete your payment and activate your account.'
        });
      } else if (isCorporate) {
        // Send registration confirmation email
        const emailBody = `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h2 style="color: #da251d;">Corporate Registration Received!</h2>
            <p>Hi ${user.name},</p>
            <p>Thank you for registering your company <strong>${user.companyName}</strong> on <strong>Industrial Times</strong>!</p>
            <p>Your corporate account application is currently under review by the SuperAdmin. Once approved, you will be able to log in, access your dashboard, and purchase advertising campaigns.</p>
            <p>You will receive an email notification once your account is active (typically within 24 hours).</p>
            <br/>
            <p>Best regards,</p>
            <p><strong>Industrial Times Team</strong></p>
          </div>
        `;
        sendEmail(user.email, "Corporate Account Application Pending Approval - Industrial Times", emailBody).catch(console.error);

        // Notify admin
        let adminEmail = process.env.ADMIN_EMAIL || 'info@industrialtimes.in';
        try {
          const EmailSettings = require('../models/EmailSettings');
          const settings = await EmailSettings.findOne();
          if (settings && settings.adminEmail) {
            adminEmail = settings.adminEmail;
          }
        } catch (e) { }

        const adminEmailBody = `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h2 style="color: #da251d;">New Corporate Application Received</h2>
            <p>A new corporate account has been registered and is pending approval:</p>
            <ul>
              <li><strong>Name:</strong> ${user.name}</li>
              <li><strong>Email:</strong> ${user.email}</li>
              <li><strong>Company:</strong> ${user.companyName}</li>
              <li><strong>Designation:</strong> ${user.designation || 'N/A'}</li>
              <li><strong>Phone:</strong> ${user.phone || 'N/A'}</li>
              <li><strong>Selected Plan:</strong> ${user.selectedPlan || 'N/A'}</li>
            </ul>
            <p>Please log in to the admin panel to review and approve/reject this application.</p>
            <br/>
            <a href="https://industrialtimes.in/superadmin@123" style="background: #da251d; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Go to Admin Panel</a>
          </div>
        `;
        sendEmail(adminEmail, "New Corporate Registration - Action Required", adminEmailBody).catch(console.error);

        res.status(201).json({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          companyName: user.companyName,
          designation: user.designation,
          phone: user.phone,
          selectedPlan: user.selectedPlan,
          membershipPlan: user.membershipPlan,
          createdAt: user.createdAt,
          token: null,
          message: 'Corporate account registered successfully! Your account is under review by the SuperAdmin. You will receive approval within 24 hours.'
        });
      } else {
        // Reader - instant access
        const emailBody = `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h2 style="color: #da251d;">Welcome to Industrial Times!</h2>
            <p>Hi ${user.name},</p>
            <p>Thank you for registering on <strong>Industrial Times</strong>, your reliable source for the latest industrial news and trends.</p>
            <p>Your account is now active! You can read premium articles, save your favorite stories, and keep up with industry trends.</p>
            <br/>
            <p>Best regards,</p>
            <p><strong>Industrial Times Team</strong></p>
          </div>
        `;
        sendEmail(user.email, "Welcome to Industrial Times!", emailBody).catch(console.error);

        res.status(201).json({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          token: generateToken(user.id)
        });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (user && (await user.comparePassword(password))) {
      // Block pending accounts from logging in
      if (user.status === 'payment_pending') {
        return res.status(402).json({
          message: 'Reporter registration payment is pending. Please complete the payment to activate your account.',
          status: 'payment_pending',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        });
      }

      if (user.status === 'pending') {
        const roleLabel = user.role === 'corporate' ? 'corporate' : 'reporter';
        return res.status(403).json({
          message: `Your ${roleLabel} account is pending administrative approval. You will be notified within 24 hours.`,
          status: 'pending'
        });
      }

      if (user.status === 'rejected') {
        return res.status(403).json({
          message: 'Your application has been rejected. Please contact support for more details.',
          status: 'rejected'
        });
      }

      if (user.status === 'suspended') {
        return res.status(403).json({
          message: 'Your account has been suspended by administration. Please contact support for assistance.',
          status: 'suspended'
        });
      }

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        companyName: user.companyName,
        designation: user.designation,
        phone: user.phone,
        selectedPlan: user.selectedPlan,
        membershipPlan: user.membershipPlan,
        bio: user.bio,
        expertise: user.expertise,
        portfolio: user.portfolio,
        profilePic: user.profilePic,
        createdAt: user.createdAt,
        isManager: user.isManager || false,
        managerPermissions: user.managerPermissions || null,
        token: generateToken(user.id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all pending corporate requests
// @route   GET /api/auth/corporate-requests
router.get('/corporate-requests', async (req, res) => {
  try {
    const pending = await User.findAll({
      where: { role: 'corporate', status: 'pending' },
      attributes: ['id', 'name', 'email', 'companyName', 'designation', 'phone', 'selectedPlan', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all pending reporter requests
// @route   GET /api/auth/reporter-requests
router.get('/reporter-requests', async (req, res) => {
  try {
    const pending = await User.findAll({
      where: {
        role: 'author',
        status: { [Op.in]: ['pending', 'payment_pending'] }
      },
      attributes: ['id', 'name', 'email', 'phone', 'bio', 'expertise', 'portfolio', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all processed corporate and reporter requests
// @route   GET /api/auth/processed-requests
router.get('/processed-requests', async (req, res) => {
  try {
    const processed = await User.findAll({
      where: {
        role: { [Op.in]: ['author', 'corporate'] },
        status: { [Op.in]: ['approved', 'rejected'] }
      },
      attributes: ['id', 'name', 'email', 'role', 'status', 'companyName', 'designation', 'phone', 'selectedPlan', 'membershipPlan', 'bio', 'expertise', 'portfolio', 'createdAt', 'updatedAt'],
      order: [['updatedAt', 'DESC']]
    });
    res.json(processed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all corporate users (approved)
// @route   GET /api/auth/corporate-users
router.get('/corporate-users', async (req, res) => {
  try {
    const users = await User.findAll({
      where: { role: 'corporate' },
      attributes: ['id', 'name', 'email', 'companyName', 'designation', 'phone', 'selectedPlan', 'membershipPlan', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Approve a corporate account
// @route   POST /api/auth/approve-corporate
router.post('/approve-corporate', async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'approved';
    await user.save();

    // Send Approval Email to Corporate
    const emailBody = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <h2 style="color: #da251d;">Corporate Account Approved!</h2>
        <p>Hi ${user.name},</p>
        <p>Your Corporate Account for <strong>${user.companyName}</strong> on Industrial Times has been approved!</p>
        <p>You can now log in to your secure portal to view your dashboard and manage your campaigns.</p>
        <br/>
        <a href="https://industrialtimes.in/corporate/login" style="background: #da251d; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Login to Corporate Portal</a>
        <br/><br/>
        <p>Best regards,</p>
        <p><strong>Industrial Times Team</strong></p>
      </div>
    `;
    await sendEmail(user.email, "Your Corporate Account is Approved! - Industrial Times", emailBody);

    res.json({
      message: `Corporate account for ${user.name} (${user.companyName}) has been approved successfully.`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        companyName: user.companyName,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Reject a corporate account
// @route   POST /api/auth/reject-corporate
router.post('/reject-corporate', async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'rejected';
    await user.save();

    res.json({
      message: `Corporate account for ${user.name} has been rejected.`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Approve a reporter account
// @route   POST /api/auth/approve-reporter
router.post('/approve-reporter', async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'approved';
    await user.save();

    // Send Approval Email to Reporter
    const emailBody = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <h2 style="color: #10b981;">Reporter Account Approved!</h2>
        <p>Congratulations ${user.name},</p>
        <p>Your application to become a Reporter on Industrial Times has been officially approved!</p>
        <p>You can now log in to your Reporter Dashboard to start drafting and publishing your articles.</p>
        <br/>
        <a href="https://industrialtimes.in/login" style="background: #10b981; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Login to Reporter Dashboard</a>
        <br/><br/>
        <p>Best regards,</p>
        <p><strong>Industrial Times Editorial Team</strong></p>
      </div>
    `;
    await sendEmail(user.email, "Your Reporter Account is Approved! - Industrial Times", emailBody);

    res.json({
      message: `Reporter "${user.name}" has been approved! They can now log in and publish articles.`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Reject a reporter account
// @route   POST /api/auth/reject-reporter
router.post('/reject-reporter', async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'rejected';
    await user.save();

    res.json({
      message: `Reporter application from "${user.name}" has been rejected.`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update user profile (e.g., profile picture)
// @route   PUT /api/auth/update-profile
router.put('/update-profile', protect, async (req, res) => {
  const { userId, profilePic, name, email, bio, expertise, password } = req.body;

  try {
    if (!userId) return res.status(400).json({ message: 'User ID is required' });

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Restriction: Managers cannot edit the superadmin profile
    if (user.role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Managers are not authorized to edit the superadmin profile.' });
    }

    if (profilePic !== undefined) user.profilePic = profilePic;
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (bio !== undefined) user.bio = bio;
    if (expertise !== undefined) user.expertise = expertise;
    if (password !== undefined && password.trim() !== '') {
      user.password = password.trim();
    }

    await user.save();

    const { logManagerActivity } = require('../utils/activityLogger');
    await logManagerActivity(req, 'Update Profile', `Updated profile of user: "${user.name}" (ID: ${user.id})`);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
        expertise: user.expertise
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get public user profile
// @route   GET /api/auth/user/:identifier
router.get('/user/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;

    let user;
    let normalizedName = identifier;

    // Check if identifier is an integer
    const isIdLookup = !isNaN(identifier) && Number.isInteger(parseFloat(identifier));

    if (!isIdLookup && typeof identifier === 'string') {
      const decoded = decodeURIComponent(identifier).trim();
      if (decoded.toLowerCase() === 'industrial-times' || decoded.toLowerCase() === 'industrial times' || decoded.toLowerCase() === 'admin') {
        normalizedName = 'Industrial Times';
      } else {
        normalizedName = decoded;
      }
    }

    if (isIdLookup) {
      user = await User.findByPk(identifier, {
        attributes: ['id', 'name', 'email', 'role', 'status', 'isManager', 'managerPermissions', 'membershipPlan', 'selectedPlan', 'bio', 'expertise', 'profilePic', 'followersCount', 'companyName', 'createdAt', 'bankVerificationStatus', 'bankDetails', 'aadharDetails']
      });
    } else {
      user = await User.findOne({
        where: { name: normalizedName },
        attributes: ['id', 'name', 'email', 'role', 'status', 'isManager', 'managerPermissions', 'membershipPlan', 'selectedPlan', 'bio', 'expertise', 'profilePic', 'followersCount', 'companyName', 'createdAt', 'bankVerificationStatus', 'bankDetails', 'aadharDetails']
      });
    }

    // Automatically seed/create "Industrial Times" if it's queried but not in DB
    if (!user && normalizedName === 'Industrial Times') {
      user = await User.create({
        name: 'Industrial Times',
        email: 'info@industrialtimes.in',
        password: 'admin123',
        role: 'superadmin',
        status: 'approved',
        bio: 'Official news and editorial coverage from the Industrial Times Editorial Team.',
        expertise: 'Industrial News, Global Press, OEM & Automation',
        profilePic: '/icon.png',
        followersCount: 0
      });
    }

    // Redirect managers to the Industrial Times admin profile, unless lookup is by ID (which is used by logged-in users / dashboards)
    if (user && user.isManager && !isIdLookup) {
      let adminUser = await User.findOne({
        where: { name: 'Industrial Times' },
        attributes: ['id', 'name', 'email', 'role', 'status', 'isManager', 'managerPermissions', 'membershipPlan', 'selectedPlan', 'bio', 'expertise', 'profilePic', 'followersCount', 'companyName', 'createdAt', 'bankVerificationStatus', 'bankDetails', 'aadharDetails']
      });
      if (!adminUser) {
        adminUser = await User.create({
          name: 'Industrial Times',
          email: 'info@industrialtimes.in',
          password: 'admin123',
          role: 'superadmin',
          status: 'approved',
          bio: 'Official news and editorial coverage from the Industrial Times Editorial Team.',
          expertise: 'Industrial News, Global Press, OEM & Automation',
          profilePic: '/icon.png',
          followersCount: 0
        });
      }
      user = adminUser;
    }

    if (!user) {
      // If user doesn't exist, return a fallback so the author page still works for legacy articles
      return res.json({ name: !isIdLookup ? identifier : 'Unknown Author', role: 'author', email: 'Not specified' });
    }

    const Follower = require('../models/Follower');
    const Rating = require('../models/Rating');

    const [followersCount, ratings] = await Promise.all([
      Follower.count({ where: { reporterId: user.id } }),
      Rating.findAll({ where: { reporterId: user.id } })
    ]);

    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0
      ? parseFloat((ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1))
      : 0;

    const userData = user.get({ plain: true });
    userData.followersCount = followersCount;
    userData.averageRating = averageRating;
    userData.ratingsCount = totalRatings;

    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Toggle Follow a reporter
// @route   POST /api/auth/follow
router.post('/follow', protect, async (req, res) => {
  const { reporterId } = req.body;
  const userId = req.user.id;

  if (!reporterId) {
    return res.status(400).json({ message: 'Reporter ID is required' });
  }

  if (String(userId) === String(reporterId)) {
    return res.status(400).json({ message: 'You cannot follow yourself' });
  }

  try {
    const reporter = await User.findByPk(reporterId);
    if (!reporter) {
      return res.status(404).json({ message: 'Reporter not found' });
    }

    const Follower = require('../models/Follower');
    const existingFollow = await Follower.findOne({ where: { userId, reporterId } });

    let followed = false;
    if (existingFollow) {
      await existingFollow.destroy();
    } else {
      await Follower.create({ userId, reporterId });
      followed = true;
    }

    const followersCount = await Follower.count({ where: { reporterId } });
    reporter.followersCount = followersCount;
    await reporter.save();

    res.json({ followed, followersCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get follow status of a reporter
// @route   GET /api/auth/follow-status/:reporterId
router.get('/follow-status/:reporterId', protect, async (req, res) => {
  const { reporterId } = req.params;
  const userId = req.user.id;

  try {
    const Follower = require('../models/Follower');
    const follow = await Follower.findOne({ where: { userId, reporterId } });
    res.json({ isFollowing: !!follow });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Rate a reporter
// @route   POST /api/auth/rate
router.post('/rate', async (req, res) => {
  const { reporterId, rating } = req.body;

  if (!reporterId || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Invalid rating or reporter ID' });
  }

  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer')) {
    try {
      const token = authHeader.split(' ')[1];
      if (token !== 'test-token-123') {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      }
    } catch (err) {
      // Treat as guest
    }
  }

  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    const reporter = await User.findByPk(reporterId);
    if (!reporter) {
      return res.status(404).json({ message: 'Reporter not found' });
    }

    if (userId && String(userId) === String(reporterId)) {
      return res.status(400).json({ message: 'You cannot rate yourself' });
    }

    const Rating = require('../models/Rating');

    let existingRating;
    if (userId) {
      existingRating = await Rating.findOne({ where: { userId, reporterId } });
    } else {
      existingRating = await Rating.findOne({ where: { ipAddress, reporterId, userId: null } });
    }

    if (existingRating) {
      existingRating.rating = rating;
      await existingRating.save();
    } else {
      await Rating.create({ userId, reporterId, rating, ipAddress });
    }

    const ratings = await Rating.findAll({ where: { reporterId } });
    const totalRatings = ratings.length;
    const averageRating = parseFloat((ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1));

    res.json({ averageRating, ratingsCount: totalRatings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update bank and Aadhar details
// @route   PUT /api/auth/update-bank-details
router.put('/update-bank-details', protect, async (req, res) => {
  const { bankDetails, aadharDetails } = req.body;

  if (!bankDetails || !aadharDetails) {
    return res.status(400).json({ message: 'Bank details and Aadhar details are required.' });
  }

  const { accountName, accountNo, ifsc, bankName } = bankDetails;
  const { number: aadharNumber } = aadharDetails;

  if (!accountName || !/^[a-zA-Z\s]{3,50}$/.test(accountName.trim())) {
    return res.status(400).json({ message: 'Account Holder Name must be between 3 and 50 characters and contain only letters.' });
  }

  if (!accountNo || !/^\d{9,18}$/.test(accountNo)) {
    return res.status(400).json({ message: 'Account Number must contain only digits (between 9 and 18 numbers).' });
  }

  if (!ifsc || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.trim().toUpperCase())) {
    return res.status(400).json({ message: 'IFSC Code must be in valid format (e.g. SBIN0000291).' });
  }

  if (!bankName || bankName.trim().length === 0) {
    return res.status(400).json({ message: 'Bank Name is required.' });
  }

  if (!aadharNumber || !/^\d{12}$/.test(aadharNumber.trim())) {
    return res.status(400).json({ message: 'Aadhar Number must be exactly 12 digits.' });
  }

  const userId = req.user.id;
  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.bankDetails = bankDetails;
    user.aadharDetails = aadharDetails;
    user.bankVerificationStatus = 'pending';
    await user.save();

    res.json({
      message: 'Bank details submitted successfully and are pending approval.',
      user: {
        bankVerificationStatus: user.bankVerificationStatus,
        bankDetails: user.bankDetails,
        aadharDetails: user.aadharDetails
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get bank verifications
// @route   GET /api/auth/bank-verifications
router.get('/bank-verifications', protect, authorize('superadmin', 'verifications'), async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const users = await User.findAll({
      where: { bankVerificationStatus: status },
      attributes: ['id', 'name', 'email', 'phone', 'role', 'bankDetails', 'aadharDetails', 'bankVerificationStatus', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Approve bank verification
// @route   POST /api/auth/approve-bank
router.post('/approve-bank', protect, authorize('superadmin', 'verifications'), async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.bankVerificationStatus = 'approved';
    await user.save();

    // Send Approval Email to User
    const emailBody = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <h2 style="color: #10b981;">Bank Verification Approved!</h2>
        <p>Hi ${user.name},</p>
        <p>Your bank and KYC details submitted to <strong>Industrial Times</strong> have been successfully verified and approved!</p>
        <p>You can now view your approved status and details in your profile dashboard.</p>
        <br/>
        <p>Best regards,</p>
        <p><strong>Industrial Times Team</strong></p>
      </div>
    `;
    await sendEmail(user.email, "Bank Verification Approved! - Industrial Times", emailBody);

    const { logManagerActivity } = require('../utils/activityLogger');
    await logManagerActivity(req, 'Approve Bank Verification', `Approved bank/KYC details for user: "${user.name}" (ID: ${user.id})`);

    res.json({ message: `Bank verification for ${user.name} approved.`, user: { id: user.id, bankVerificationStatus: user.bankVerificationStatus } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Reject bank verification
// @route   POST /api/auth/reject-bank
router.post('/reject-bank', protect, authorize('superadmin', 'verifications'), async (req, res) => {
  const { userId, reason } = req.body;
  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.bankVerificationStatus = 'rejected';
    await user.save();

    // Send Rejection Email to User
    const emailBody = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <h2 style="color: #ef4444;">Bank Verification Rejected</h2>
        <p>Hi ${user.name},</p>
        <p>Unfortunately, the bank and KYC details you submitted to <strong>Industrial Times</strong> could not be verified and have been rejected.</p>
        ${reason ? `<p><strong>Reason for rejection:</strong> ${reason}</p>` : ''}
        <p>Please log in to your dashboard, check your profile, and re-submit your details with correct information.</p>
        <br/>
        <p>Best regards,</p>
        <p><strong>Industrial Times Team</strong></p>
      </div>
    `;
    await sendEmail(user.email, "Bank Verification Rejected - Industrial Times", emailBody);

    const { logManagerActivity } = require('../utils/activityLogger');
    await logManagerActivity(req, 'Reject Bank Verification', `Rejected bank/KYC details for user: "${user.name}" (ID: ${user.id})${reason ? ` | Reason: ${reason}` : ''}`);

    res.json({ message: `Bank verification for ${user.name} rejected.`, user: { id: user.id, bankVerificationStatus: user.bankVerificationStatus } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Clear/Delete user bank and KYC details (SuperAdmin only)
// @route   POST /api/auth/clear-bank-details
router.post('/clear-bank-details', protect, authorize('superadmin', 'verifications'), async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.bankDetails = null;
    user.aadharDetails = null;
    user.bankVerificationStatus = 'unverified';
    await user.save();

    const { logManagerActivity } = require('../utils/activityLogger');
    await logManagerActivity(req, 'Clear Bank Details', `Cleared bank/KYC details for user: "${user.name}" (ID: ${user.id})`);

    res.json({ message: `Bank details for ${user.name} have been cleared/deleted.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get followers list for a reporter
// @route   GET /api/auth/followers/:reporterId
router.get('/followers/:reporterId', protect, async (req, res) => {
  const { reporterId } = req.params;
  try {
    const Follower = require('../models/Follower');

    // Find all followers for this reporter
    const followers = await Follower.findAll({ where: { reporterId } });

    const userIds = followers.map(f => f.userId);
    if (userIds.length === 0) {
      return res.json([]);
    }

    // Get user details for these followers
    const users = await User.findAll({
      where: { id: { [Op.in]: userIds } },
      attributes: ['id', 'name', 'email', 'role', 'createdAt']
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create Razorpay Order for Reporter Registration
// @route   POST /api/auth/reporter/create-payment-order
router.post('/reporter/create-payment-order', async (req, res) => {
  try {
    const { userId, promoCode } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'author') {
      return res.status(400).json({ error: 'Only reporters require registration payment.' });
    }

    if (user.status === 'approved') {
      return res.status(400).json({ error: 'Reporter account is already active.' });
    }

    const registrationFee = parseFloat(await PlatformSettings.getSetting('reporter_registration_fee', '999'));
    const gstRate = parseFloat(await PlatformSettings.getSetting('reporter_gst_rate', '18'));
    let finalAmount = Math.round(registrationFee * (1 + gstRate / 100)); // Base Fee + GST

    if (promoCode) {
      const PromoCode = require('../models/PromoCode');
      const promo = await PromoCode.findOne({ where: { code: promoCode.trim().toUpperCase() } });
      if (promo && promo.isActive) {
        const now = new Date();
        const isStarted = !promo.startDate || new Date(promo.startDate) <= now;
        const isNotExpired = !promo.endDate || new Date(promo.endDate) >= now;
        const hasUsesLeft = promo.maxUses === null || promo.usedCount < promo.maxUses;
        const isApplicable = promo.applicableTo === 'all' || promo.applicableTo === 'reporter';
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

    const options = {
      amount,
      currency: "INR",
      receipt: `reporter_receipt_${user.id}_${Date.now()}`,
      notes: {
        userId: user.id,
        email: user.email,
        name: user.name,
        promoCode: promoCode || ''
      }
    };

    const order = await razorpay.orders.create(options);
    res.json({ order, registrationFee, gstRate, finalAmount });
  } catch (error) {
    console.error("Razorpay Reporter Order Error:", error);
    const detail = error?.error?.description || error?.description || error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
    res.status(500).json({ error: `Could not create Razorpay order for reporter registration: ${detail}` });
  }
});

// @desc    Verify Razorpay Payment and Activate Reporter
// @route   POST /api/auth/reporter/verify-payment
router.post('/reporter/verify-payment', async (req, res) => {
  try {
    const { 
      userId,
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      promoCode
    } = req.body;

    if (!userId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'All payment parameters are required.' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder')
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // Increment usedCount if coupon applied
    if (promoCode) {
      const PromoCode = require('../models/PromoCode');
      const promo = await PromoCode.findOne({ where: { code: promoCode.trim().toUpperCase() } });
      if (promo && promo.isActive) {
        const now = new Date();
        const isStarted = !promo.startDate || new Date(promo.startDate) <= now;
        const isNotExpired = !promo.endDate || new Date(promo.endDate) >= now;
        const hasUsesLeft = promo.maxUses === null || promo.usedCount < promo.maxUses;
        const isApplicable = promo.applicableTo === 'all' || promo.applicableTo === 'reporter';
        const registrationFee = parseFloat(await PlatformSettings.getSetting('reporter_registration_fee', '999'));
        const gstRate = parseFloat(await PlatformSettings.getSetting('reporter_gst_rate', '18'));
        const originalTotal = Math.round(registrationFee * (1 + gstRate / 100));
        const isAboveMin = originalTotal >= parseFloat(promo.minOrderAmount);

        if (isStarted && isNotExpired && hasUsesLeft && isApplicable && isAboveMin) {
          promo.usedCount += 1;
          await promo.save();
        }
      }
    }

    user.status = 'pending';
    await user.save();

    // Send confirmation email
    const emailBody = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <h2 style="color: #da251d;">Reporter Registration Payment Received</h2>
        <p>Hi ${user.name},</p>
        <p>Thank you! Your registration payment has been verified successfully.</p>
        <p>Your reporter account is now under review by our editorial team. We will check your expertise and profile details.</p>
        <p>You will receive an email notification once your account has been approved by the superadmin (typically within 24 hours).</p>
        <br/>
        <p>Best regards,</p>
        <p><strong>Industrial Times Editorial Team</strong></p>
      </div>
    `;
    sendEmail(user.email, "Reporter Registration Payment Received - Industrial Times", emailBody).catch(console.error);

    res.json({
      message: "Payment verified successfully. Your account is now pending admin approval.",
      status: 'pending',
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error("Reporter Payment Verification Error:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

// @desc    Simulate Payment and Activate Reporter (Bypass/Sandbox)
// @route   POST /api/auth/reporter/simulate-payment
router.post('/reporter/simulate-payment', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'author') {
      return res.status(400).json({ error: 'Only reporters require registration payment.' });
    }

    user.status = 'pending';
    await user.save();

    // Send welcome email
    const emailBody = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <h2 style="color: #da251d;">Welcome to Industrial Times!</h2>
        <p>Hi ${user.name},</p>
        <p>Thank you! Your simulated registration payment was processed successfully.</p>
        <p>Your reporter account is now under review by our editorial team. We will check your expertise and profile details.</p>
        <p>You will receive an email notification once your account has been approved by the superadmin (typically within 24 hours).</p>
        <br/>
        <p>Best regards,</p>
        <p><strong>Industrial Times Editorial Team</strong></p>
      </div>
    `;
    sendEmail(user.email, "Reporter Registration Payment Received - Industrial Times", emailBody).catch(console.error);

    res.json({
      message: "Simulated payment processed successfully. Your account is now pending admin approval.",
      status: 'pending',
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error("Reporter Simulated Payment Error:", error);
    res.status(500).json({ error: "Simulated payment activation failed" });
  }
});

module.exports = router;
