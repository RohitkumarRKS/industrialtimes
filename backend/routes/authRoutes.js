const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
    const needsApproval = isCorporate || isReporter;

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
          token: null,
          message: 'Corporate account registered successfully. Your account is pending administrative approval. You will be notified once approved.'
        });
      } else {
        // Reader - instant access
        res.status(201).json({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
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

module.exports = router;
