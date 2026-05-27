const SiteAnalytics = require('./models/SiteAnalytics');
const sequelize = require('./config/db');

async function testAnalytics() {
  await sequelize.authenticate();
  const today = new Date().toISOString().split('T')[0];
  const [analytics] = await SiteAnalytics.findOrCreate({
    where: { date: today },
    defaults: { totalViews: 10, uniqueVisitors: 5 }
  });
  console.log('Test Analytics Created:', analytics.toJSON());
  process.exit(0);
}
testAnalytics();
