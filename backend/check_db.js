const Article = require('./models/Article');
const sequelize = require('./config/db');

async function checkArticles() {
  try {
    await sequelize.authenticate();
    const articles = await Article.findAll();
    console.log(`Total articles: ${articles.length}`);
    articles.forEach(a => {
      console.log(`ID: ${a.id}, Title: ${a.title}, Category: ${a.category}, Video: ${a.video}, VideoUrl: ${a.videoUrl}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkArticles();
