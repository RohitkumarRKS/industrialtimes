const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const articleRoutes = require('./routes/articleRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const adRoutes = require('./routes/adRoutes');
const podcastRoutes = require('./routes/podcastRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const planRoutes = require('./routes/planRoutes');
const adRequestRoutes = require('./routes/adRequestRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Ensure models are loaded for sequelize.sync
require('./models/AdRequest');
require('./models/EmailSettings');
require('./models/EmailLog');
require('./models/PodcastFormField');
require('./models/SeoSettings');
require('./models/SiteAnalytics');
require('./models/BreakingNews');
require('./models/Follower');
require('./models/Rating');

// Load env vars
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/podcast', podcastRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/ad-requests', adRequestRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/analytics', analyticsRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const fs = require('fs');
  const distPath = path.join(__dirname, '..', 'frontend', 'dist');
  
  app.use(express.static(distPath));
  
  // Crawler detection middleware for social media OG tags
  app.get(/.*/, async (req, res) => {
    const userAgent = req.headers['user-agent'] || '';
    const isCrawler = /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|Slackbot|TelegramBot|Pinterest|vkShare|Discordbot/i.test(userAgent);
    
    // Check if this is an article URL pattern: /article/:category/:title/:id
    const articleMatch = req.path.match(/^\/article\/[^/]+\/[^/]+\/(\d+)$/);
    
    if (isCrawler && articleMatch) {
      try {
        const Article = require('./models/Article');
        const articleId = articleMatch[1];
        const article = await Article.findByPk(articleId);
        
        if (article) {
          let indexHtml = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');
          
          const title = article.title || 'Industrial Times';
          const description = article.content ? article.content.substring(0, 200).replace(/[<>"'&]/g, '') : 'Read on Industrial Times Network';
          const imageUrl = article.image ? (article.image.startsWith('http') ? article.image : `${req.protocol}://${req.get('host')}${article.image}`) : '';
          const pageUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
          
          // Inject dynamic OG meta tags by replacing the default ones
          const ogTags = `
            <meta property="og:type" content="article" />
            <meta property="og:site_name" content="Industrial Times Network" />
            <meta property="og:title" content="${title}" />
            <meta property="og:description" content="${description}" />
            <meta property="og:image" content="${imageUrl}" />
            <meta property="og:url" content="${pageUrl}" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="${title}" />
            <meta name="twitter:description" content="${description}" />
            <meta name="twitter:image" content="${imageUrl}" />
          `;
          
          // Replace the default OG tags with article-specific ones
          indexHtml = indexHtml.replace(
            /<!-- Default OG Tags.*?<meta name="twitter:description"[^>]*>/s,
            ogTags
          );
          
          // Also update the title tag
          indexHtml = indexHtml.replace(
            /<title>.*?<\/title>/,
            `<title>${title} | Industrial Times</title>`
          );
          
          return res.send(indexHtml);
        }
      } catch (err) {
        console.error('Error serving OG tags for crawler:', err.message);
      }
    }
    
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Helper to convert absolute localhost URLs in database to relative paths
const fixExistingImageUrls = async () => {
  try {
    const Article = require('./models/Article');
    const Ad = require('./models/Ad');
    const User = require('./models/User');

    // Fix Articles
    const articles = await Article.findAll();
    for (const art of articles) {
      let updated = false;
      if (art.image && (art.image.startsWith('http://localhost:5000') || art.image.startsWith('http://localhost:3000'))) {
        art.image = art.image.replace(/http:\/\/localhost:(5000|3000)/g, '');
        updated = true;
      }
      if (art.video && (art.video.startsWith('http://localhost:5000') || art.video.startsWith('http://localhost:3000'))) {
        art.video = art.video.replace(/http:\/\/localhost:(5000|3000)/g, '');
        updated = true;
      }
      if (updated) await art.save();
    }

    // Fix Ads
    const ads = await Ad.findAll();
    for (const ad of ads) {
      if (ad.imageUrl && (ad.imageUrl.startsWith('http://localhost:5000') || ad.imageUrl.startsWith('http://localhost:3000'))) {
        ad.imageUrl = ad.imageUrl.replace(/http:\/\/localhost:(5000|3000)/g, '');
        await ad.save();
      }
    }

    // Fix Users
    const users = await User.findAll();
    for (const user of users) {
      if (user.profilePic && (user.profilePic.startsWith('http://localhost:5000') || user.profilePic.startsWith('http://localhost:3000'))) {
        user.profilePic = user.profilePic.replace(/http:\/\/localhost:(5000|3000)/g, '');
        await user.save();
      }
    }
    console.log('✅ Checked and normalized image/video URLs in the database to relative paths');
  } catch (err) {
    console.error('⚠️ Failed to normalize image/video URLs in database:', err.message);
  }
};

// Sync Database
sequelize.authenticate().then(async () => {
  console.log('Database connected successfully. Schema synchronization must be done via sync.js in production.');
  await fixExistingImageUrls();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Database connection failed:', err);
});

