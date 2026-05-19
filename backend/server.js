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

// Ensure models are loaded for sequelize.sync
require('./models/AdRequest');
require('./models/EmailSettings');
require('./models/EmailLog');
require('./models/PodcastFormField');

// Load env vars
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

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

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
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
      if (art.image && art.image.startsWith('http://localhost:5000')) {
        art.image = art.image.replace('http://localhost:5000', '');
        updated = true;
      }
      if (art.video && art.video.startsWith('http://localhost:5000')) {
        art.video = art.video.replace('http://localhost:5000', '');
        updated = true;
      }
      if (updated) await art.save();
    }

    // Fix Ads
    const ads = await Ad.findAll();
    for (const ad of ads) {
      if (ad.imageUrl && ad.imageUrl.startsWith('http://localhost:5000')) {
        ad.imageUrl = ad.imageUrl.replace('http://localhost:5000', '');
        await ad.save();
      }
    }

    // Fix Users
    const users = await User.findAll();
    for (const user of users) {
      if (user.profilePic && user.profilePic.startsWith('http://localhost:5000')) {
        user.profilePic = user.profilePic.replace('http://localhost:5000', '');
        await user.save();
      }
    }
    console.log('✅ Checked and normalized image/video URLs in the database to relative paths');
  } catch (err) {
    console.error('⚠️ Failed to normalize image/video URLs in database:', err.message);
  }
};

// Sync Database
sequelize.sync({ alter: true }).then(async () => {
  console.log('Database connected & synced');
  await fixExistingImageUrls();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Database connection failed:', err);
});

