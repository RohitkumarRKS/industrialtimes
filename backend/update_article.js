const Article = require('./models/Article');
const sequelize = require('./config/db');

async function updateArticle() {
  try {
    await sequelize.authenticate();
    await Article.update(
      { video: '/uploads/1778241047341.mp4' },
      { where: { id: 4 } }
    );
    console.log('Article 4 updated with video.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updateArticle();
