const sequelize = require('./config/db');
const AdRevenue = require('./models/AdRevenue');
const Withdrawal = require('./models/Withdrawal');
const AdPricing = require('./models/AdPricing');
const AdRequest = require('./models/AdRequest');
const Ad = require('./models/Ad');
const User = require('./models/User');

const clearFakePayments = async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connection established successfully.');

    console.log('Clearing AdRevenue (payment records) from database...');
    const adRevCount = await AdRevenue.destroy({ where: {}, truncate: false });
    console.log(`Cleared ${adRevCount} AdRevenue records.`);

    console.log('Clearing Withdrawal requests from database...');
    const withdrawalCount = await Withdrawal.destroy({ where: {}, truncate: false });
    console.log(`Cleared ${withdrawalCount} Withdrawal records.`);

    console.log('Clearing AdPricing (quotes) from database...');
    const pricingCount = await AdPricing.destroy({ where: {}, truncate: false });
    console.log(`Cleared ${pricingCount} AdPricing records.`);

    console.log('Clearing AdRequest (campaign submissions) from database...');
    const requestCount = await AdRequest.destroy({ where: {}, truncate: false });
    console.log(`Cleared ${requestCount} AdRequest records.`);

    console.log('Clearing active Ad banners from database...');
    const adCount = await Ad.destroy({ where: {}, truncate: false });
    console.log(`Cleared ${adCount} Ad banner records.`);

    console.log('Resetting user membership plans and subscriptions...');
    const [userCount] = await User.update(
      { membershipPlan: null, selectedPlan: null, planExpiry: null },
      { where: {} }
    );
    console.log(`Reset plan states for ${userCount} users.`);

    console.log('✅ Database cleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    process.exit(1);
  }
};

clearFakePayments();
