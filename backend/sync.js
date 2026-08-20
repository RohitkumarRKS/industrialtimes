const sequelize = require('./config/db');

// Require all models to ensure they are registered with Sequelize
require('./models/AdRequest');
require('./models/EmailSettings');
require('./models/EmailLog');
require('./models/PodcastFormField');
require('./models/PodcastGuest');
require('./models/PodcastEpisode');
require('./models/SeoSettings');
require('./models/SiteAnalytics'); // Our new model
require('./models/BreakingNews');
// Any models directly required in routes will also be imported if we require the routes, but requiring models directly is safer.
require('./models/Article');
require('./models/Ad');
require('./models/User');
require('./models/Plan');
require('./models/Follower');
require('./models/Rating');
require('./models/AdPricing');
require('./models/AdRevenue');
require('./models/Withdrawal');
require('./models/PlatformSettings');
require('./models/AdAreaPricing');
require('./models/Comment');
require('./models/ManagerActivity');
require('./models/PromoCode');

const syncDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connection established successfully.');

    console.log('Syncing database tables (alter: true)...');
    // Using alter: true updates existing tables to match the models, adding missing columns/tables
    // but not dropping existing data.
    await sequelize.sync({ alter: true });
    
    console.log('✅ Database synchronization complete. All tables are ready.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database sync failed:', error);
    process.exit(1);
  }
};

syncDatabase();
