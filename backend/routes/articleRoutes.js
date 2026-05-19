const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const Comment = require('../models/Comment');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all articles
// @route   GET /api/articles
router.get('/', async (req, res) => {
  try {
    const { search, date } = req.query;
    const { Op } = require('sequelize');
    let whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
        { category: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (date) {
      // Assuming date is in YYYY-MM-DD format
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      whereClause.createdAt = {
        [Op.between]: [startOfDay, endOfDay]
      };
    }

    const articles = await Article.findAll({ 
      where: whereClause,
      order: [['createdAt', 'DESC']] 
    });
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get article by id
// @route   GET /api/articles/:id
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (article) {
      // Increment view count
      article.views = (article.views || 0) + 1;
      await article.save();
      res.json(article);
    } else {
      res.status(404).json({ message: 'Article not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, authorize('superadmin', 'author', 'corporate'), async (req, res) => {
  const { title, content, image, video, videoUrl, category, trending, state, city, highlights, author } = req.body;

  try {
    const articleData = {
      title,
      content,
      image,
      video,
      videoUrl,
      category,
      trending,
      state,
      city,
      author,
      highlights: highlights ? JSON.stringify(highlights) : null
    };

    if (req.user && req.user.id > 0) {
      articleData.authorId = req.user.id;
      if (!articleData.author) {
        const User = require('../models/User');
        const user = await User.findByPk(req.user.id);
        if (user) {
          articleData.author = user.name;
        }
      }
    }

    const article = await Article.create(articleData);
    res.status(201).json(article);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update an article (Admin only)
// @route   PUT /api/articles/:id
router.put('/:id', protect, authorize('superadmin'), async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (article) {
      const updateData = { ...req.body };
      if (updateData.highlights) {
        updateData.highlights = JSON.stringify(updateData.highlights);
      }
      await article.update(updateData);
      res.json(article);
    } else {
      res.status(404).json({ message: 'Article not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete an article (Admin only)
// @route   DELETE /api/articles/:id
router.delete('/:id', protect, authorize('superadmin'), async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (article) {
      await article.destroy();
      res.json({ message: 'Article removed' });
    } else {
      res.status(404).json({ message: 'Article not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get articles by category
// @route   GET /api/articles/category/:category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { Op } = require('sequelize');
    
    let whereClause;
    const catLower = category.toLowerCase();

    if (catLower === 'videos') {
      // Return everything that has a valid video file OR a video URL
      whereClause = {
        [Op.or]: [
          { 
            video: { 
              [Op.and]: [{ [Op.not]: null }, { [Op.ne]: '' }] 
            } 
          },
          { 
            videoUrl: { 
              [Op.and]: [{ [Op.not]: null }, { [Op.ne]: '' }] 
            } 
          }
        ]
      };
    } else if (catLower === 'news' || catLower === 'all') {
      // 'News' section shows everything
      whereClause = {};
    } else if (catLower === 'trending') {
      // Trending shows articles marked as trending OR those with high view count
      whereClause = {
        [Op.or]: [
          { trending: true },
          { views: { [Op.gt]: 0 } } // Any view count > 0 can be trending for now, or set a higher threshold
        ]
      };
    } else {
      // Standard category filter (case-insensitive matches)
      whereClause = { 
        [Op.or]: [
          { category: category },
          { category: category.charAt(0).toUpperCase() + category.slice(1).toLowerCase() },
          { category: category.toLowerCase() }
        ]
      };
    }

    const order = catLower === 'trending' ? [['views', 'DESC']] : [['createdAt', 'DESC']];

    const articles = await Article.findAll({ 
      where: whereClause, 
      order: order 
    });
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get articles by location (State only)
// @route   GET /api/articles/location/:state
router.get('/location/:state', async (req, res) => {
  try {
    const { state } = req.params;
    const articles = await Article.findAll({ 
      where: { state }, 
      order: [['createdAt', 'DESC']] 
    });
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get articles by location (State and City)
// @route   GET /api/articles/location/:state/:city
router.get('/location/:state/:city', async (req, res) => {
  try {
    const { state, city } = req.params;
    const articles = await Article.findAll({ 
      where: { state, city }, 
      order: [['createdAt', 'DESC']] 
    });
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Increment like count
// @route   POST /api/articles/:id/like
router.post('/:id/like', async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (article) {
      article.likesCount += 1;
      await article.save();
      res.json({ likesCount: article.likesCount });
    } else {
      res.status(404).json({ message: 'Article not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get comments for an article
// @route   GET /api/articles/:id/comments
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { articleId: req.params.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Post a comment
// @route   POST /api/articles/:id/comments
router.post('/:id/comments', async (req, res) => {
  const { userName, content } = req.body;
  try {
    const comment = await Comment.create({
      articleId: req.params.id,
      userName,
      content
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
