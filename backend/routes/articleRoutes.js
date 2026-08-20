const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const Comment = require('../models/Comment');
const { protect, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const likeOp = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;

// --- AI Text Moderation Helper (Gemini API) ---
const checkTextSafety = (title, content) => {
  return new Promise((resolve) => {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) return resolve({ safe: true });

    const https = require('https');
    const postData = JSON.stringify({
      contents: [{
        parts: [{
          text: "Analyze this article title and content. Does it contain nudity description, explicit 18+ adult themes, graphic violence, pornography, or extreme profanity? " +
                "You must respond with a JSON object in this exact format: {\"safe\": true/false, \"reason\": \"reason description if unsafe\"}. " +
                "Return only the raw JSON. Do not wrap it in markdown block formatting.\n\n" +
                `Title: ${title}\n` +
                `Content: ${content}`
        }]
      }]
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const reqApi = https.request(options, (resApi) => {
      let body = '';
      resApi.on('data', (chunk) => body += chunk);
      resApi.on('end', () => {
        try {
          const data = JSON.parse(body);
          const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!responseText) return resolve({ safe: true });

          const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanText);
          resolve({
            safe: parsed.safe !== false,
            reason: parsed.reason || 'Content violates safety guidelines.'
          });
        } catch (err) {
          resolve({ safe: true });
        }
      });
    });

    reqApi.on('error', (err) => {
      resolve({ safe: true });
    });

    reqApi.write(postData);
    reqApi.end();
  });
};


// @desc    Get all articles
// @route   GET /api/articles
router.get('/', async (req, res) => {
  try {
    const { search, date, authorId, authorName, includeContent, limit, page } = req.query;
    let whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { title: { [likeOp]: `%${search}%` } },
        { content: { [likeOp]: `%${search}%` } },
        { category: { [likeOp]: `%${search}%` } },
        { tags: { [likeOp]: `%${search}%` } },
        { highlights: { [likeOp]: `%${search}%` } }
      ];
    }

    if (authorId) {
      whereClause.authorId = authorId;
    } else if (authorName) {
      whereClause.author = authorName;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      whereClause.createdAt = {
        [Op.between]: [startOfDay, endOfDay]
      };
    }

    const attributesOption = includeContent === 'true' 
      ? {} 
      : { exclude: ['content'] };

    const queryOptions = {
      where: whereClause,
      attributes: attributesOption,
      order: [
        ['trending', 'DESC'],
        ['createdAt', 'DESC']
      ]
    };

    const parsedLimit = limit ? parseInt(limit, 10) : null;
    const parsedPage = page ? parseInt(page, 10) : 1;
    if (parsedLimit && !isNaN(parsedLimit)) {
      queryOptions.limit = parsedLimit;
      queryOptions.offset = (parsedPage - 1) * parsedLimit;
    } else if (!search && !authorId && !authorName && !date) {
      // Default safety limit to prevent downloading thousands of articles at once
      queryOptions.limit = 50;
    }

    const articles = await Article.findAll(queryOptions);
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get article by slug
// @route   GET /api/articles/slug/:slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({ message: 'Slug is required' });
    }

    const decodedSlug = decodeURIComponent(slug).toLowerCase().trim();
    // Helper to normalize strings to match slugs (Unicode-aware)
    const normalize = (str) => {
      if (!str) return '';
      return str
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')                // Replace spaces/whitespace with hyphens
        .replace(/[^\p{L}\p{N}-]+/gu, '')    // Keep Unicode letters, numbers, and hyphens
        .replace(/-+/g, '-')                 // Collapse multiple consecutive hyphens
        .replace(/(^-|-$)/g, '');            // Strip leading/trailing hyphens
    };

    const cleanSlug = normalize(decodedSlug);
    const searchWords = cleanSlug.split('-').filter(w => w.length > 2);

    // 1. Direct DB lookup using SQL LIKE for the first few main title words to avoid full table memory scan
    let match = null;
    if (searchWords.length > 0) {
      const candidateClause = searchWords.slice(0, 3).map(word => ({
        title: { [likeOp]: `%${word}%` }
      }));
      const candidateArticles = await Article.findAll({
        where: { [Op.and]: candidateClause },
        attributes: ['id', 'title'],
        limit: 10
      });
      match = candidateArticles.find(a => normalize(a.title) === cleanSlug);
    }

    // 2. Fallback to recent 200 articles if direct word match didn't find exact hit
    if (!match) {
      const recentArticles = await Article.findAll({
        attributes: ['id', 'title'],
        order: [['createdAt', 'DESC']],
        limit: 200
      });
      match = recentArticles.find(a => normalize(a.title) === cleanSlug);

      if (!match && searchWords.length > 0) {
        let bestMatch = null;
        let highestScore = 0;

        for (const a of recentArticles) {
          if (!a.title) continue;
          const titleWords = normalize(a.title).split('-');
          const score = searchWords.filter(w => titleWords.includes(w)).length;
          if (score > highestScore) {
            highestScore = score;
            bestMatch = a;
          }
        }

        if (bestMatch && (highestScore / searchWords.length) >= 0.6) {
          match = bestMatch;
        }
      }
    }

    if (match) {
      const article = await Article.findByPk(match.id);
      if (!article) {
        return res.status(404).json({ message: 'Article not found' });
      }
      // Increment view count
      article.views = (article.views || 0) + 1;
      await article.save();

      // Log into SiteAnalytics
      try {
        const SiteAnalytics = require('../models/SiteAnalytics');
        const today = new Date().toISOString().split('T')[0];
        let analytics = await SiteAnalytics.findOne({ where: { date: today } });

        if (!analytics) {
          analytics = await SiteAnalytics.create({ date: today, totalViews: 0, uniqueVisitors: 0 });
        }

        analytics.totalViews += 1;
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
        let analytics = await SiteAnalytics.findOne({ where: { date: today } });

        if (!analytics) {
          analytics = await SiteAnalytics.create({ date: today, totalViews: 0, uniqueVisitors: 0 });
        }

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

  // Check text safety before creating the article
  const safety = await checkTextSafety(title, content);
  if (!safety.safe) {
    return res.status(400).json({ message: `❌ Submission Blocked: ${safety.reason}` });
  }

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

    if (req.user) {
      let authorUserId = req.user.id;
      if (authorUserId === 0 || req.user.role === 'superadmin' || req.user.isManager) {
        const User = require('../models/User');
        let adminUser = await User.findOne({ where: { name: 'Industrial Times' } });
        if (!adminUser) {
          const bcrypt = require('bcryptjs');
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash('admin123', salt);
          adminUser = await User.create({
            name: 'Industrial Times',
            email: 'info@industrialtimes.in',
            password: hashedPassword,
            role: 'superadmin',
            status: 'approved',
            bio: 'Official news and editorial coverage from the Industrial Times Editorial Team.',
            expertise: 'Industrial News, Global Press, OEM & Automation',
            profilePic: '/icon.png',
            followersCount: 0
          });
        }
        articleData.authorId = adminUser.id;
        articleData.author = 'Industrial Times';
      } else {
        articleData.authorId = authorUserId;
        if (!articleData.author) {
          const User = require('../models/User');
          const user = await User.findByPk(authorUserId);
          if (user) {
            articleData.author = user.name;
          }
        }
      }
    }

    const article = await Article.create(articleData);

    // Credit reward to reporter only if published under their own profile (not as manager/admin on behalf of Industrial Times)
    if (req.user && req.user.role === 'author' && article.authorId === req.user.id) {
      try {
        const AdRevenue = require('../models/AdRevenue');
        const contentLength = (content || '').length;
        let rewardInt = 1;
        if (contentLength < 500) {
          rewardInt = Math.floor(Math.random() * 2) + 1; // 1 to 2
        } else if (contentLength <= 1500) {
          rewardInt = Math.floor(Math.random() * 3) + 2; // 2 to 4
        } else {
          rewardInt = Math.floor(Math.random() * 2) + 4; // 4 to 5
        }

        await AdRevenue.create({
          userId: req.user.id,
          amount: rewardInt,
          gstAmount: 0.00,
          totalAmount: rewardInt,
          type: 'article_reward',
          status: 'completed',
          description: `Article reward: "${article.title}"`
        });
      } catch (err) {
        console.error('Error crediting article reward:', err);
      }
    }

    const { logManagerActivity } = require('../utils/activityLogger');
    await logManagerActivity(req, 'Create Article', `Created article: "${article.title}" (ID: ${article.id}) in category "${article.category}"`);

    res.status(201).json(article);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update an article (Admin only)
// @route   PUT /api/articles/:id
router.put('/:id', protect, authorize('superadmin', 'manager'), async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (article) {
      const updateData = { ...req.body };
      if (updateData.highlights) {
        updateData.highlights = JSON.stringify(updateData.highlights);
      }
      await article.update(updateData);

      const { logManagerActivity } = require('../utils/activityLogger');
      await logManagerActivity(req, 'Update Article', `Updated article: "${article.title}" (ID: ${article.id})`);

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
router.delete('/:id', protect, authorize('superadmin', 'manager'), async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (article) {
      const articleTitle = article.title;
      const articleId = article.id;
      await article.destroy();

      const { logManagerActivity } = require('../utils/activityLogger');
      await logManagerActivity(req, 'Delete Article', `Deleted article: "${articleTitle}" (ID: ${articleId})`);

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
    const catLower = category.toLowerCase();
    let whereClause = {};

    if (catLower === 'videos' || catLower === 'video') {
      whereClause = {
        [Op.or]: [
          { video: { [Op.notIn]: [null, ''] } },
          { videoUrl: { [Op.notIn]: [null, ''] } }
        ]
      };
    } else if (catLower === 'news' || catLower === 'all') {
      whereClause = {};
    } else if (catLower === 'trending') {
      whereClause = {
        [Op.or]: [
          { trending: true },
          { category: { [likeOp]: 'trending' } }
        ]
      };
    } else {
      let matchCategories = [category];
      if (catLower === 'interview' || catLower === 'interviews') {
        matchCategories = ['Interview', 'Interviews'];
      } else if (catLower === 'startup' || catLower === 'startups') {
        matchCategories = ['Startup', 'Startups'];
      } else if (catLower === 'event' || catLower === 'events') {
        matchCategories = ['Event', 'Events'];
      } else if (catLower === 'tender' || catLower === 'tenders') {
        matchCategories = ['Tender', 'Tenders'];
      } else if (catLower === 'video' || catLower === 'videos') {
        matchCategories = ['Video', 'Videos'];
      } else if (catLower === 'astrology' || catLower === 'astrologies') {
        matchCategories = ['Astrology', 'Astrologies'];
      }

      const orConditions = [];
      matchCategories.forEach(cat => {
        orConditions.push({ category: cat });
        orConditions.push({ category: cat.toLowerCase() });
        orConditions.push({ category: cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase() });
      });

      whereClause = {
        [Op.or]: orConditions
      };
    }

    const sortOrder = catLower === 'trending' 
      ? [['trending', 'DESC'], ['createdAt', 'DESC']] 
      : [['createdAt', 'DESC']];

    const { includeContent, limit, page } = req.query;
    const attributesOption = includeContent === 'true' ? {} : { exclude: ['content'] };
    const queryOptions = {
      where: whereClause,
      attributes: attributesOption,
      order: sortOrder
    };

    const parsedLimit = limit ? parseInt(limit, 10) : 30;
    const parsedPage = page ? parseInt(page, 10) : 1;
    if (parsedLimit && !isNaN(parsedLimit)) {
      queryOptions.limit = parsedLimit;
      queryOptions.offset = (parsedPage - 1) * parsedLimit;
    }

    const articles = await Article.findAll(queryOptions);
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
    const { includeContent, limit, page } = req.query;
    const attributesOption = includeContent === 'true' ? {} : { exclude: ['content'] };
    const queryOptions = {
      where: { state },
      attributes: attributesOption,
      order: [['createdAt', 'DESC']]
    };

    const parsedLimit = limit ? parseInt(limit, 10) : 30;
    const parsedPage = page ? parseInt(page, 10) : 1;
    if (parsedLimit && !isNaN(parsedLimit)) {
      queryOptions.limit = parsedLimit;
      queryOptions.offset = (parsedPage - 1) * parsedLimit;
    }

    const articles = await Article.findAll(queryOptions);
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
    const { includeContent, limit, page } = req.query;
    const attributesOption = includeContent === 'true' ? {} : { exclude: ['content'] };
    const queryOptions = {
      where: { state, city },
      attributes: attributesOption,
      order: [['createdAt', 'DESC']]
    };

    const parsedLimit = limit ? parseInt(limit, 10) : 30;
    const parsedPage = page ? parseInt(page, 10) : 1;
    if (parsedLimit && !isNaN(parsedLimit)) {
      queryOptions.limit = parsedLimit;
      queryOptions.offset = (parsedPage - 1) * parsedLimit;
    }

    const articles = await Article.findAll(queryOptions);
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
      await article.increment('likesCount');
      // Reload to get new value
      await article.reload();
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
router.post('/:id/comments', protect, async (req, res) => {
  const { content } = req.body;
  try {
    const comment = await Comment.create({
      articleId: req.params.id,
      userName: req.user.name,
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
    const authorId = req.params.authorId;

    // Get all articles by this author
    const myArticles = await Article.findAll({
      where: { authorId },
      attributes: { exclude: ['content'] },
      order: [['createdAt', 'DESC']]
    });

    // Also try matching by authorName query param
    const authorName = req.query.authorName;
    let nameArticles = [];
    if (authorName) {
      nameArticles = await Article.findAll({
        where: {
          author: authorName,
          [Op.or]: [
            { authorId: null },
            { authorId: { [Op.ne]: authorId } }
          ]
        },
        attributes: { exclude: ['content'] },
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

// @desc    Enhance and rewrite article content using AI (Supports Gemini & OpenAI)
// @route   POST /api/articles/enhance
router.post('/enhance', protect, async (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ message: 'Content is required for AI enhancement' });
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const https = require('https');

  const humanizeInstructions = 
    "You are an expert investigative journalist and copyeditor for 'Industrial Times'. " +
    "Rewrite and enhance the following article content so that it reads as if it was written by an experienced human reporter. " +
    "Follow these strict rules to ensure human-like readability and prevent search engine/AI detection flags:\n" +
    "1. High Burstiness: Vary your sentence lengths. Write some short, punchy 3-8 word sentences alongside longer, detailed compound sentences.\n" +
    "2. High Perplexity: Use diverse vocabulary. Avoid predictable AI transition words such as 'Furthermore', 'Moreover', 'In conclusion', 'Crucially', 'Delve', 'Pivotal', 'Testament', 'It is important to note', or 'In summary'.\n" +
    "3. Write in an active, direct journalistic voice. Avoid passive voice.\n" +
    "4. Maintain absolute factual accuracy. Keep all numbers, dates, company names, and data points unchanged.\n" +
    "5. Completely rephrase and restructure sentences so there are no matching sentence structures or phrases from the source content to prevent copyright/duplicate content flags.\n" +
    "6. Do NOT output markdown wrappers (like ```markdown) or HTML. Output raw, clean paragraphs only.\n\n" +
    "Text to rewrite:\n\n";

  // 1. Google Gemini AI (Free Tier available)
  if (geminiApiKey) {
    const postData = JSON.stringify({
      contents: [{
        parts: [{
          text: humanizeInstructions + content
        }]
      }],
      generationConfig: {
        temperature: 0.85
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiApiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const reqApi = https.request(options, (resApi) => {
      let body = '';
      resApi.on('data', (chunk) => body += chunk);
      resApi.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (resApi.statusCode !== 200) {
            return res.status(resApi.statusCode || 500).json({
              message: data.error?.message || `Gemini API returned status ${resApi.statusCode}`
            });
          }
          const enhancedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!enhancedText) {
            return res.status(500).json({ message: 'Gemini API did not return text' });
          }
          res.json({
            enhancedText: enhancedText.trim(),
            message: 'Enhanced using Google Gemini AI (Free Tier)'
          });
        } catch (err) {
          console.error(err);
          res.status(500).json({ message: `AI Enhancement failed to parse response: ${err.message}` });
        }
      });
    });

    reqApi.on('error', (err) => {
      console.error(err);
      res.status(500).json({ message: `AI Enhancement network error: ${err.message}` });
    });

    reqApi.write(postData);
    reqApi.end();
    return;
  }

  // 2. OpenAI ChatGPT AI (Paid Tier)
  if (openaiApiKey) {
    const postData = JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: humanizeInstructions.replace("Text to rewrite:\n\n", "")
        },
        {
          role: 'user',
          content: content
        }
      ],
      temperature: 0.85
    });

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const reqApi = https.request(options, (resApi) => {
      let body = '';
      resApi.on('data', (chunk) => body += chunk);
      resApi.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (resApi.statusCode !== 200) {
            return res.status(resApi.statusCode || 500).json({
              message: data.error?.message || `OpenAI API returned status ${resApi.statusCode}`
            });
          }
          const enhancedText = data.choices?.[0]?.message?.content;
          if (!enhancedText) {
            return res.status(500).json({ message: 'OpenAI API did not return text' });
          }
          res.json({
            enhancedText: enhancedText.trim(),
            message: 'Enhanced using OpenAI ChatGPT AI'
          });
        } catch (err) {
          console.error(err);
          res.status(500).json({ message: `AI Enhancement failed to parse response: ${err.message}` });
        }
      });
    });

    reqApi.on('error', (err) => {
      console.error(err);
      res.status(500).json({ message: `AI Enhancement network error: ${err.message}` });
    });

    reqApi.write(postData);
    reqApi.end();
    return;
  }

  // 3. Smart Local Formatter Fallback
  console.warn('⚠️ No AI API key configured in .env. Using smart local formatting fallback.');
  let enhanced = content.trim();
  const paragraphs = enhanced.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const formattedParagraphs = paragraphs.map(p => {
    let text = p.replace(/(^\s*|[.!?]\s+)([a-z])/g, (match, separator, letter) => separator + letter.toUpperCase());
    text = text.replace(/\s+/g, ' ');
    return text;
  });

  const localEnhancedText = formattedParagraphs.join('\n\n');
  res.json({
    enhancedText: localEnhancedText,
    message: 'Enhanced using smart local formatting. (Add GEMINI_API_KEY or OPENAI_API_KEY to your .env to enable AI)'
  });
});

module.exports = router;

