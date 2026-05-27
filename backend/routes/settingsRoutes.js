const express = require('express');
const router = express.Router();
const EmailSettings = require('../models/EmailSettings');
const EmailLog = require('../models/EmailLog');
const SeoSettings = require('../models/SeoSettings');

// @desc    Get email settings
// @route   GET /api/settings/email
router.get('/email', async (req, res) => {
  try {
    const [settings] = await EmailSettings.findOrCreate({
      where: { id: 1 },
      defaults: {
        adminEmail: process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'admin@industrialtimes.com',
        emailSignature: 'Best regards,\nIndustrial Times Team'
      }
    });
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
    const [settings] = await EmailSettings.findOrCreate({
      where: { id: 1 }
    });
    
    settings.adminEmail = adminEmail || settings.adminEmail;
    settings.emailSignature = emailSignature || settings.emailSignature;
    
    await settings.save();
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
      limit: 50 // Get last 50 logs
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const https = require('https');

// Cache object for Google Trends
let trendsCache = {
  data: [],
  lastFetched: null
};

// Scrape daily trending searches from Google Trends RSS feed
const getGoogleTrends = () => {
  return new Promise((resolve) => {
    const now = new Date();
    // Use cached keywords if less than 1 hour old
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
          // Matches <title>Topic Name</title> elements in RSS XML
          const matches = xml.matchAll(/<title>([^<]+)<\/title>/g);
          let count = 0;
          for (const match of matches) {
            count++;
            if (count === 1) continue; // Skip the main RSS feed channel title
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
    const [settings] = await SeoSettings.findOrCreate({
      where: { id: 1 },
      defaults: {
        siteTitle: 'Industrial Times',
        metaDescription: 'Your reliable source for the latest industrial news and trends.',
        metaKeywords: 'industry, news, manufacturing, trending',
        breakingNewsSpeed: 35,
        googleAnalyticsId: '',
        podcastHeaderTitle: 'Podcast Guest Application',
        podcastHeaderDescription: 'Join industry leaders on the Industrial Times podcast. Share your insights, experiences, and vision with our global audience of manufacturing professionals.'
      }
    });

    const settingsObj = settings.toJSON();
    const googleTrends = await getGoogleTrends();
    
    // Ensure we have at least 6 tags in use. If Google trends doesn't have 6, combine with default tags.
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
      // For Public Website: if DB keywords are empty, automatically replace with active trends
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
    const [settings] = await SeoSettings.findOrCreate({
      where: { id: 1 }
    });
    
    if (siteTitle !== undefined) settings.siteTitle = siteTitle;
    if (metaDescription !== undefined) settings.metaDescription = metaDescription;
    if (metaKeywords !== undefined) settings.metaKeywords = metaKeywords;
    if (breakingNewsSpeed !== undefined) settings.breakingNewsSpeed = breakingNewsSpeed;
    if (googleAnalyticsId !== undefined) settings.googleAnalyticsId = googleAnalyticsId;
    if (podcastHeaderTitle !== undefined) settings.podcastHeaderTitle = podcastHeaderTitle;
    if (podcastHeaderDescription !== undefined) settings.podcastHeaderDescription = podcastHeaderDescription;
    
    await settings.save();
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
router.post('/breaking-news', async (req, res) => {
  const { text, isActive, priority } = req.body;
  try {
    const item = await BreakingNews.create({
      text,
      isActive: isActive !== undefined ? isActive : true,
      priority: priority || 0
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update a breaking news headline
// @route   PUT /api/settings/breaking-news/:id
router.put('/breaking-news/:id', async (req, res) => {
  const { text, isActive, priority } = req.body;
  try {
    const item = await BreakingNews.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Headline not found' });

    if (text !== undefined) item.text = text;
    if (isActive !== undefined) item.isActive = isActive;
    if (priority !== undefined) item.priority = priority;

    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a breaking news headline
// @route   DELETE /api/settings/breaking-news/:id
router.delete('/breaking-news/:id', async (req, res) => {
  try {
    const item = await BreakingNews.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Headline not found' });

    await item.destroy();
    res.json({ message: 'Headline deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
