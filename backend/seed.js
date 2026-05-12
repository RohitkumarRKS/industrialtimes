const sequelize = require('./config/db');
const Article = require('./models/Article');

const seedData = async () => {
  try {
    await sequelize.sync({ force: true }); // Warning: This clears the DB
    console.log('Database synced for seeding...');

    const articles = [
      {
        title: 'Industry 4.0: The Future of Manufacturing',
        content: 'Industry 4.0 is transforming the way companies manufacture, improve and distribute their products. Manufacturers are integrating new technologies, including Internet of Things (IoT), cloud computing and analytics, and AI and machine learning into their production facilities and throughout their operations.',
        category: 'Manufacturing',
        image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1000',
        trending: true
      },
      {
        title: 'Global Supply Chain Innovations in 2026',
        content: 'The global supply chain is undergoing a massive transformation driven by autonomous vehicles, blockchain for transparency, and AI-driven demand forecasting. These innovations are helping companies reduce costs and improve delivery times significantly.',
        category: 'Logistics',
        image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1000',
        trending: false
      },
      {
        title: 'Sustainable Energy in Heavy Industry',
        content: 'Heavy industries like steel and cement are turning to green hydrogen and carbon capture technologies to meet net-zero targets. This shift is not only environmental but is becoming a core competitive advantage in the global market.',
        category: 'Energy',
        image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=1000',
        trending: true
      }
    ];

    await Article.bulkCreate(articles);
    console.log('✅ Seed successful! 3 Dummy Articles created.');
    process.exit();
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedData();
