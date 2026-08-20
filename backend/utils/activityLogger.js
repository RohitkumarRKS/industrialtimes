const ManagerActivity = require('../models/ManagerActivity');

const logManagerActivity = async (req, action, details) => {
  try {
    let managerId = null;
    let managerName = 'System/Unknown';
    let ipAddress = null;

    if (req) {
      if (req.user) {
        // Log activity if they are a manager or superadmin
        if (req.user.isManager || req.user.role === 'manager' || req.user.role === 'superadmin') {
          managerId = req.user.id;
          managerName = req.user.name;
        }
      }
      ipAddress = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress;
      // Truncate IPv6 prefixes if present in simple formats
      if (ipAddress && ipAddress.startsWith('::ffff:')) {
        ipAddress = ipAddress.replace('::ffff:', '');
      }
    }

    // Only log to DB if we successfully resolved a manager/admin ID to avoid spamming system tasks
    if (managerId) {
      await ManagerActivity.create({
        managerId,
        managerName,
        action,
        details,
        ipAddress
      });
      console.log(`[ACTIVITY LOG] Manager ${managerName} (${managerId}) performed: "${action}" - ${details} [IP: ${ipAddress}]`);
    }
  } catch (error) {
    console.error('Failed to log manager activity:', error.message);
  }
};

module.exports = { logManagerActivity };
