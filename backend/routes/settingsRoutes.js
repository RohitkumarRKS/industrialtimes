const express = require('express');
const router = express.Router();
const EmailSettings = require('../models/EmailSettings');
const EmailLog = require('../models/EmailLog');
const SeoSettings = require('../models/SeoSettings');
const https = require('https');
const { protect, authorize } = require('../middleware/auth');

// Helper: findOrCreate equivalent for singleton settings
const getOrCreateEmailSettings = async () => {
  let settings = await EmailSettings.findOne();
  if (!settings) {
    settings = await EmailSettings.create({
      id: 1, // Sequelize singleton uses id: 1
      adminEmail: process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'admin@industrialtimes.com',
      emailSignature: 'Best regards,\nIndustrial Times Team'
    });
  }
  return settings;
};

const getOrCreateSeoSettings = async (defaults = {}) => {
  let settings = await SeoSettings.findOne();
  if (!settings) {
    settings = await SeoSettings.create({
      id: 1, // Sequelize singleton uses id: 1
      siteTitle: 'Industrial Times',
      metaDescription: 'Your reliable source for the latest industrial news and trends.',
      metaKeywords: 'industry, news, manufacturing, trending',
      breakingNewsSpeed: 35,
      googleAnalyticsId: 'G-P5M643PL4W',
      podcastHeaderTitle: 'Podcast Guest Application',
      podcastHeaderDescription: 'Join industry leaders on the Industrial Times podcast. Share your insights, experiences, and vision with our global audience of manufacturing professionals.',
      ...defaults
    });
  }
  return settings;
};

// @desc    Get email settings
// @route   GET /api/settings/email
router.get('/email', async (req, res) => {
  try {
    const settings = await getOrCreateEmailSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update email settings
// @route   PUT /api/settings/email
router.put('/email', async (req, res) => {
  const { adminEmail, emailSignature } = req.body;
  
  try {
    const settings = await getOrCreateEmailSettings();
    
    await settings.update({
      adminEmail: adminEmail || settings.adminEmail,
      emailSignature: emailSignature || settings.emailSignature
    });
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get email logs
// @route   GET /api/settings/email-logs
router.get('/email-logs', async (req, res) => {
  try {
    const logs = await EmailLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cache object for Google Trends
let trendsCache = {
  data: [],
  lastFetched: null
};

// Scrape daily trending searches from Google Trends RSS feed
const getGoogleTrends = () => {
  return new Promise((resolve) => {
    const now = new Date();
    if (trendsCache.data.length > 0 && trendsCache.lastFetched && (now - trendsCache.lastFetched < 3600000)) {
      return resolve(trendsCache.data);
    }

    https.get('https://trends.google.com/trends/trendingsearches/daily/rss?geo=IN', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (res) => {
      let xml = '';
      res.on('data', (chunk) => { xml += chunk; });
      res.on('end', () => {
        try {
          const titles = [];
          const matches = xml.matchAll(/<title>([^<]+)<\/title>/g);
          let count = 0;
          for (const match of matches) {
            count++;
            if (count === 1) continue;
            const term = match[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
            if (term && !titles.includes(term)) {
              titles.push(term);
            }
          }
          const trends = titles.slice(0, 15);
          trendsCache.data = trends;
          trendsCache.lastFetched = new Date();
          resolve(trends);
        } catch (err) {
          console.error('Error parsing Google Trends RSS:', err);
          resolve(trendsCache.data || []);
        }
      });
    }).on('error', (err) => {
      console.error('Error fetching Google Trends RSS:', err);
      resolve(trendsCache.data || []);
    });
  });
};

// @desc    Get SEO settings
// @route   GET /api/settings/seo
router.get('/seo', async (req, res) => {
  try {
    const settings = await getOrCreateSeoSettings();

    const settingsObj = settings.get({ plain: true });
    const googleTrends = await getGoogleTrends();
    
    const defaultFallbacks = ['industry', 'news', 'manufacturing', 'automation', 'trending', 'technology', 'engineering', 'business'];
    const activeGoogleTrends = googleTrends.length >= 6 
      ? googleTrends 
      : [...new Set([...googleTrends, ...defaultFallbacks])].slice(0, 15);
    
    const formattedTrends = activeGoogleTrends.join(', ');
    settingsObj.autoKeywords = formattedTrends;

    const isDbKeywordsEmpty = !settingsObj.metaKeywords || settingsObj.metaKeywords.trim() === '';
    settingsObj.isAutoTrends = isDbKeywordsEmpty;

    if (req.query.admin === 'true') {
      // For Admin Page: keep metaKeywords empty so they don't statically submit the fallback
    } else {
      if (isDbKeywordsEmpty) {
        settingsObj.metaKeywords = formattedTrends;
      }
    }

    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update SEO settings
// @route   PUT /api/settings/seo
router.put('/seo', async (req, res) => {
  const { siteTitle, metaDescription, metaKeywords, breakingNewsSpeed, googleAnalyticsId, podcastHeaderTitle, podcastHeaderDescription } = req.body;
  
  try {
    const settings = await getOrCreateSeoSettings();
    
    const updateData = {};
    if (siteTitle !== undefined) updateData.siteTitle = siteTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (metaKeywords !== undefined) updateData.metaKeywords = metaKeywords;
    if (breakingNewsSpeed !== undefined) updateData.breakingNewsSpeed = breakingNewsSpeed;
    if (googleAnalyticsId !== undefined) updateData.googleAnalyticsId = googleAnalyticsId;
    if (podcastHeaderTitle !== undefined) updateData.podcastHeaderTitle = podcastHeaderTitle;
    if (podcastHeaderDescription !== undefined) updateData.podcastHeaderDescription = podcastHeaderDescription;
    
    await settings.update(updateData);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────────────────────────────────────
//  BREAKING NEWS
// ──────────────────────────────────────────────
const BreakingNews = require('../models/BreakingNews');

// @desc    Get all active breaking news (public)
// @route   GET /api/settings/breaking-news
router.get('/breaking-news', async (req, res) => {
  try {
    const news = await BreakingNews.findAll({
      where: { isActive: true },
      order: [['priority', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get ALL breaking news (admin - includes inactive)
// @route   GET /api/settings/breaking-news/all
router.get('/breaking-news/all', async (req, res) => {
  try {
    const news = await BreakingNews.findAll({
      order: [['priority', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a breaking news headline
// @route   POST /api/settings/breaking-news
router.post('/breaking-news', protect, authorize('superadmin', 'breaking_news'), async (req, res) => {
  const { text, isActive, priority } = req.body;
  try {
    const item = await BreakingNews.create({
      text,
      isActive: isActive !== undefined ? isActive : true,
      priority: priority || 0
    });

    const { logManagerActivity } = require('../utils/activityLogger');
    await logManagerActivity(req, 'Create Breaking News', `Created breaking news: "${item.text}" (ID: ${item.id})`);

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update a breaking news headline
// @route   PUT /api/settings/breaking-news/:id
router.put('/breaking-news/:id', protect, authorize('superadmin', 'breaking_news'), async (req, res) => {
  const { text, isActive, priority } = req.body;
  try {
    const item = await BreakingNews.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Headline not found' });

    await item.update({
      text: text !== undefined ? text : item.text,
      isActive: isActive !== undefined ? isActive : item.isActive,
      priority: priority !== undefined ? priority : item.priority
    });

    const { logManagerActivity } = require('../utils/activityLogger');
    await logManagerActivity(req, 'Update Breaking News', `Updated breaking news: "${item.text}" (ID: ${item.id}). Active: ${item.isActive}, Priority: ${item.priority}`);

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a breaking news headline
// @route   DELETE /api/settings/breaking-news/:id
router.delete('/breaking-news/:id', protect, authorize('superadmin', 'breaking_news'), async (req, res) => {
  try {
    const item = await BreakingNews.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Headline not found' });

    const oldText = item.text;
    const oldId = item.id;
    await item.destroy();

    const { logManagerActivity } = require('../utils/activityLogger');
    await logManagerActivity(req, 'Delete Breaking News', `Deleted breaking news: "${oldText}" (ID: ${oldId})`);

    res.json({ message: 'Headline deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
