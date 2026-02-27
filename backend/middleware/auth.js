const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Merchant = require('../models/Merchant');
const DeliveryBoy = require('../models/DeliveryBoy');

// Universal protect middleware - works for all user types
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Determine user type from token
    if (decoded.type === 'merchant') {
      req.currentUser = await Merchant.findById(decoded.id);
      req.userType = 'merchant';
    } else if (decoded.type === 'delivery') {
      req.currentUser = await DeliveryBoy.findById(decoded.id);
      req.userType = 'delivery';
    } else if (decoded.type === 'admin') {
      req.currentUser = await User.findById(decoded.id);
      req.userType = 'admin';
    } else {
      req.currentUser = await User.findById(decoded.id);
      req.userType = 'user';
    }

    if (!req.currentUser) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = req.currentUser;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

// Authorize specific user types
exports.authorizeType = (...types) => {
  return (req, res, next) => {
    if (!types.includes(req.userType)) {
      return res.status(403).json({ 
        success: false, 
        message: `Only ${types.join(' or ')} can access this route` 
      });
    }
    next();
  };
};

// Legacy authorize for role-based access
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (req.user && !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'User role is not authorized to access this route' });
    }
    next();
  };
};
