import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const requireAuth = (...roles) => {
  return async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        req.user = await User.findById(decoded.id).select('-password');
        
        if (!req.user) {
          return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
        }

        if (roles.length > 0 && !roles.includes(req.user.role)) {
          return res.status(403).json({ success: false, message: 'Forbidden, insufficient permissions' });
        }

        next();
      } catch (error) {
        return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
      }
    } else {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
  };
};
