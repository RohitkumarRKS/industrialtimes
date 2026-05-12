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

// Sync Database
sequelize.sync({ alter: true }).then(() => {
  console.log('Database connected & synced');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Database connection failed:', err);
});

