const { verifyToken } = require('../utils/jwt.util');

const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = verifyToken(token);
    
    // Attach user to request
    req.user = decoded; 
    // Example format info inside req.user: { id: 'someObjectId', role: 'INTERNAL', iat: timestamp, exp: timestamp }
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized - Token failed' });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role ${req.user.role} is not authorized to access this route` 
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
