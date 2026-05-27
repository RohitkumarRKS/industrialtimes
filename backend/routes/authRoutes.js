const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendEmail } = require('../utils/email');
const { protect } = require('../middleware/auth');

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
    const needsApproval = isReporter || isCorporate; // Both reporters and corporates require admin approval

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
      status: needsApproval ? 'pending' : 'approved',
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
        res.status(201).json({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          token: null,
          message: 'Reporter account registered successfully! Your application is under review. You will receive approval within 24 hours.'
        });
      } else if (isCorporate) {
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
      // Block pending accounts from logging in (both corporate and reporter)
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
      where: { role: 'author', status: 'pending' },
      attributes: ['id', 'name', 'email', 'phone', 'bio', 'expertise', 'portfolio', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all processed corporate and reporter requests (approved or rejected)
// @route   GET /api/auth/processed-requests
router.get('/processed-requests', async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const processed = await User.findAll({
      where: {
        role: { [Op.or]: ['author', 'corporate'] },
        status: { [Op.or]: ['approved', 'rejected'] }
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
        <a href="http://industrial-times.com/corporate/login" style="background: #da251d; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Login to Corporate Portal</a>
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
        <a href="http://industrial-times.com/login" style="background: #10b981; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Login to Reporter Dashboard</a>
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
router.put('/update-profile', async (req, res) => {
  const { userId, profilePic } = req.body;
  
  try {
    if (!userId) return res.status(400).json({ message: 'User ID is required' });
    
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (profilePic !== undefined) {
      user.profilePic = profilePic;
    }
    
    await user.save();
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic
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
    const { Op } = require('sequelize');
    
    let user;
    if (!isNaN(identifier)) {
      user = await User.findByPk(identifier, {
        attributes: ['id', 'name', 'email', 'role', 'bio', 'expertise', 'profilePic', 'followersCount', 'companyName', 'createdAt']
      });
    } else {
      user = await User.findOne({
        where: { name: identifier }, // SQLite doesn't support iLike out of the box so we use exact or we can rely on frontend mapping
        attributes: ['id', 'name', 'email', 'role', 'bio', 'expertise', 'profilePic', 'followersCount', 'companyName', 'createdAt']
      });
    }

    if (!user) {
      // If user doesn't exist, return a fallback so the author page still works for legacy articles
      return res.json({ name: isNaN(identifier) ? identifier : 'Unknown Author', role: 'author', email: 'Not specified' });
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

    const userData = user.toJSON();
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

  if (parseInt(userId) === parseInt(reporterId)) {
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

    if (userId && parseInt(userId) === parseInt(reporterId)) {
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

module.exports = router;
