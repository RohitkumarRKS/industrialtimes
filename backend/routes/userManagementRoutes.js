const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Article = require('../models/Article');
const Ad = require('../models/Ad');
const AdRequest = require('../models/AdRequest');
const { protect, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

// @desc    Get all users with optional role filter
// @route   GET /api/users/all?role=user,author,corporate
router.get('/all', protect, authorize('superadmin', 'manager'), async (req, res) => {
  try {
    const { role, search } = req.query;
    
    const where = {};
    
    if (role) {
      const roles = role.split(',');
      where.role = { [Op.in]: roles };
    }
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get full details of a specific user (profile + articles + ads)
// @route   GET /api/users/:id/details
router.get('/:id/details', protect, authorize('superadmin', 'manager'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch user's articles
    let articles = [];
    try {
      articles = await Article.findAll({
        where: {
          [Op.or]: [
            { authorId: user.id },
            { author: user.name }
          ]
        },
        order: [['createdAt', 'DESC']]
      });
    } catch (e) {
      // Article model might not have authorId
      try {
        articles = await Article.findAll({
          where: { author: user.name },
          order: [['createdAt', 'DESC']]
        });
      } catch (e2) {}
    }

    // Fetch user's ads
    let ads = [];
    try {
      ads = await Ad.findAll({
        where: { userId: user.id },
        order: [['createdAt', 'DESC']]
      });
    } catch (e) {}

    // Fetch user's ad requests
    let adRequests = [];
    try {
      adRequests = await AdRequest.findAll({
        where: { userId: user.id },
        order: [['createdAt', 'DESC']]
      });
    } catch (e) {}

    res.json({
      user: user.get({ plain: true }),
      articles,
      ads,
      adRequests,
      stats: {
        totalArticles: articles.length,
        totalViews: articles.reduce((sum, a) => sum + (a.views || 0), 0),
        totalLikes: articles.reduce((sum, a) => sum + (a.likes || 0), 0),
        totalAds: ads.length,
        totalAdRequests: adRequests.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Edit a user's details
// @route   PUT /api/users/:id
router.put('/:id', protect, authorize('superadmin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, email, phone, role, status, bio, expertise, companyName, designation, isManager } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    if (bio !== undefined) updateData.bio = bio;
    if (expertise !== undefined) updateData.expertise = expertise;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (designation !== undefined) updateData.designation = designation;
    if (isManager !== undefined) {
      updateData.isManager = isManager;
      if (isManager) {
        // If promoting to manager, default to full permissions if none exist yet
        const existingPermissions = user.managerPermissions;
        let parsedPermissions = [];
        if (existingPermissions) {
          if (Array.isArray(existingPermissions)) {
            parsedPermissions = existingPermissions;
          } else if (typeof existingPermissions === 'string') {
            try { parsedPermissions = JSON.parse(existingPermissions); } catch (e) {}
          }
        }
        if (parsedPermissions.length === 0) {
          updateData.managerPermissions = ['dashboard', 'news', 'analytics', 'profile', 'ads', 'ad_calendar', 'podcast', 'webinars', 'email_settings', 'seo', 'plans', 'ad_requests', 'ad_pricing', 'revenue', 'verifications', 'notifications', 'breaking_news', 'users'];
        }
      } else {
        updateData.managerPermissions = null;
      }
    }

    await user.update(updateData);

    const updated = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    res.json({ message: `User "${updated.name}" updated successfully.`, user: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a user (and optionally their content)
// @route   DELETE /api/users/:id
router.delete('/:id', protect, authorize('superadmin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'superadmin') {
      return res.status(403).json({ message: 'Cannot delete a superadmin account.' });
    }

    const deleteContent = req.query.deleteContent === 'true';

    if (deleteContent) {
      // Delete user's articles
      try {
        await Article.destroy({ where: { author: user.name } });
      } catch (e) {}
      // Delete user's ads
      try {
        await Ad.destroy({ where: { userId: user.id } });
      } catch (e) {}
      // Delete user's ad requests
      try {
        await AdRequest.destroy({ where: { userId: user.id } });
      } catch (e) {}
    }

    const userName = user.name;
    await user.destroy();

    res.json({ message: `User "${userName}" has been permanently deleted.${deleteContent ? ' All associated content has also been removed.' : ''}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a specific article (admin removing user content)
// @route   DELETE /api/users/content/article/:articleId
router.delete('/content/article/:articleId', protect, authorize('superadmin'), async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.articleId);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    const title = article.title;
    await article.destroy();
    res.json({ message: `Article "${title}" has been deleted.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Assign a user as manager with specific permissions
// @route   POST /api/users/:id/assign-manager
router.post('/:id/assign-manager', protect, authorize('superadmin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'superadmin') {
      return res.status(400).json({ message: 'Superadmin already has full access.' });
    }

    const { permissions } = req.body;
    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({ message: 'At least one permission must be selected.' });
    }

    await user.update({
      isManager: true,
      managerPermissions: permissions
    });

    const updated = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    const { logManagerActivity } = require('../utils/activityLogger');
    await logManagerActivity(req, 'Assign Manager Rights', `Assigned manager rights to user: "${user.name}" (ID: ${user.id}) with permissions: [${permissions.join(', ')}]`);

    res.json({
      message: `"${user.name}" has been assigned as Manager with ${permissions.length} permissions.`,
      user: updated
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Revoke manager access from a user
// @route   POST /api/users/:id/revoke-manager
router.post('/:id/revoke-manager', protect, authorize('superadmin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({
      isManager: false,
      managerPermissions: null
    });

    const { logManagerActivity } = require('../utils/activityLogger');
    await logManagerActivity(req, 'Revoke Manager Rights', `Revoked manager rights from user: "${user.name}" (ID: ${user.id})`);

    res.json({ message: `Manager access has been revoked from "${user.name}".` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all managers
// @route   GET /api/users/managers
router.get('/managers/list', protect, authorize('superadmin'), async (req, res) => {
  try {
    const managers = await User.findAll({
      where: { isManager: true },
      attributes: { exclude: ['password'] },
      order: [['updatedAt', 'DESC']]
    });
    res.json(managers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all manager activity logs
// @route   GET /api/users/managers/activities
router.get('/managers/activities', protect, authorize('superadmin'), async (req, res) => {
  try {
    const ManagerActivity = require('../models/ManagerActivity');
    const activities = await ManagerActivity.findAll({
      order: [['createdAt', 'DESC']],
      limit: 500
    });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
