const sequelize = require('./config/db');
const User = require('./models/User');

async function check() {
  await sequelize.authenticate();
  const user = await User.findOne({ where: { email: 'chandanjha39@gmail.com' } });
  if (user) {
    console.log('User found:', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      isManager: user.isManager,
      managerPermissions: user.managerPermissions
    });
  } else {
    console.log('User not found');
  }
  process.exit(0);
}

check().catch(console.error);
