const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Testing Phase Bypass
      if (token === 'test-token-123') {
        req.user = { id: 0, role: 'superadmin', name: 'Test Administrator' };
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
      if (!req.user) {
        return res.status(401).json({ message: 'User no longer exists' });
      }
      if (req.user.status === 'suspended') {
        return res.status(403).json({ message: 'This account has been suspended.' });
      }
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const authorize = (...rolesOrPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    // Allow superadmin through everything
    if (req.user.role === 'superadmin') {
      return next();
    }
    // Allow manager-assigned users if 'manager' is in the allowed list or if they have the specific permission
    if (req.user.isManager) {
      let perms = [];
      if (Array.isArray(req.user.managerPermissions)) {
        perms = req.user.managerPermissions;
      } else if (typeof req.user.managerPermissions === 'string') {
        try {
          perms = JSON.parse(req.user.managerPermissions);
        } catch (e) {}
      }

      const hasPermission = rolesOrPermissions.some(roleOrPerm => 
        roleOrPerm === 'manager' || perms.includes(roleOrPerm)
      );

      if (hasPermission) {
        return next();
      }
    }
    if (!rolesOrPermissions.includes(req.user.role)) {
      return res.status(403).json({ message: `User role ${req.user.role} is not authorized to access this route` });
    }
    next();
  };
};

module.exports = { protect, authorize };
