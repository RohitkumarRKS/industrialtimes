const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const Comment = require('../models/Comment');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all articles
// @route   GET /api/articles
router.get('/', async (req, res) => {
  try {
    const { search, date, authorId, authorName } = req.query;
    const { Op } = require('sequelize');
    let whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
        { category: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (authorId) {
      whereClause.authorId = authorId;
    } else if (authorName) {
      whereClause.author = authorName;
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

      // Log into SiteAnalytics
      try {
        const SiteAnalytics = require('../models/SiteAnalytics');
        const today = new Date().toISOString().split('T')[0];
        const [analytics] = await SiteAnalytics.findOrCreate({
          where: { date: today },
          defaults: { totalViews: 0, uniqueVisitors: 0 }
        });
        
        analytics.totalViews += 1;
        // Simulate unique visitors (roughly 80% are unique)
        if (Math.random() > 0.2) {
          analytics.uniqueVisitors += 1;
        }
        await analytics.save();
      } catch (analyticsError) {
        console.error('Error logging analytics:', analyticsError);
      }

      res.json(article);
    } else {
      res.status(404).json({ message: 'Article not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, authorize('superadmin', 'author', 'corporate'), async (req, res) => {
  const { title, content, image, video, videoUrl, category, trending, state, city, highlights, author, tags } = req.body;

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
      tags,
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

// @desc    Get real analytics for a specific author
// @route   GET /api/articles/author-stats/:authorId
router.get('/author-stats/:authorId', async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const authorId = parseInt(req.params.authorId);

    // Get all articles by this author
    const myArticles = await Article.findAll({
      where: { authorId },
      order: [['createdAt', 'DESC']]
    });

    // Also try matching by authorName query param
    const authorName = req.query.authorName;
    let nameArticles = [];
    if (authorName) {
      nameArticles = await Article.findAll({
        where: {
          author: { [Op.iLike]: authorName },
          [Op.or]: [
            { authorId: { [Op.is]: null } },
            { authorId: { [Op.ne]: authorId } }
          ]
        },
        order: [['createdAt', 'DESC']]
      });
    }

    const allArticles = [...myArticles, ...nameArticles];
    const articleIds = allArticles.map(a => a.id);

    // Count real comments across all author's articles
    let totalComments = 0;
    if (articleIds.length > 0) {
      totalComments = await Comment.count({
        where: { articleId: { [Op.in]: articleIds } }
      });
    }

    // Compute real stats
    const totalArticles = allArticles.length;
    const totalViews = allArticles.reduce((sum, a) => sum + (a.views || 0), 0);
    const totalLikes = allArticles.reduce((sum, a) => sum + (a.likesCount || 0), 0);

    // Category breakdown
    const categoryMap = {};
    allArticles.forEach(a => {
      const cat = a.category || 'Uncategorized';
      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, views: 0, likes: 0 };
      categoryMap[cat].count += 1;
      categoryMap[cat].views += (a.views || 0);
      categoryMap[cat].likes += (a.likesCount || 0);
    });

    // Top 5 articles by views
    const topArticles = [...allArticles]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5)
      .map(a => ({
        id: a.id,
        title: a.title,
        category: a.category,
        views: a.views || 0,
        likes: a.likesCount || 0,
        createdAt: a.createdAt
      }));

    // Monthly publishing trend (last 6 months)
    const monthlyTrend = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyTrend[key] = { count: 0, views: 0 };
    }
    allArticles.forEach(a => {
      const d = new Date(a.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyTrend[key]) {
        monthlyTrend[key].count += 1;
        monthlyTrend[key].views += (a.views || 0);
      }
    });

    // Recent articles (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentArticles = allArticles.filter(a => new Date(a.createdAt) >= weekAgo).length;
    const recentViews = allArticles.filter(a => new Date(a.createdAt) >= weekAgo).reduce((s, a) => s + (a.views || 0), 0);

    // Avg views per article
    const avgViewsPerArticle = totalArticles > 0 ? Math.round(totalViews / totalArticles) : 0;

    // Engagement rate = (likes + comments) / views * 100
    const engagementRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews * 100).toFixed(1) : '0.0';

    res.json({
      totalArticles,
      totalViews,
      totalLikes,
      totalComments,
      avgViewsPerArticle,
      engagementRate,
      recentArticles,
      recentViews,
      categoryBreakdown: categoryMap,
      topArticles,
      monthlyTrend
    });
  } catch (error) {
    console.error('Author stats error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
