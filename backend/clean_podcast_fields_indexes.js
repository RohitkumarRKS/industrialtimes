const sequelize = require('./config/db');

async function clean() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    // PostgreSQL-compatible: Find all non-primary indexes on PodcastFormFields
    const [indexes] = await sequelize.query(`
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'PodcastFormFields' 
        AND indexname NOT LIKE '%_pkey'
    `);
    console.log(`Found ${indexes.length} non-primary indexes.`);

    for (const index of indexes) {
      const indexName = index.indexname;
      console.log(`Dropping index: ${indexName}`);
      try {
        await sequelize.query(`DROP INDEX IF EXISTS "${indexName}"`);
        console.log(`Dropped index: ${indexName}`);
      } catch (err) {
        console.error(`Failed to drop index ${indexName}:`, err.message);
      }
    }

    console.log('✅ Index cleanup complete.');
  } catch (error) {
    console.error('❌ Error during index cleanup:', error);
  } finally {
    process.exit(0);
  }
}

clean();
