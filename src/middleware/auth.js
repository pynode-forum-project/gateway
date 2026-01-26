const jwt = require('jsonwebtoken');
const axios = require('axios');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:5001';

/**
 * Custom error class for authentication errors
 */
class AuthenticationError extends Error {
  constructor(message, statusCode = 401) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = statusCode;
  }
}

/**
 * Custom error class for authorization errors
 */
class AuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
  }
}

/**
 * Verify JWT token middleware
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new AuthenticationError('No authorization header provided');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Invalid authorization format. Use: Bearer <token>');
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user is banned
    if (decoded.active === false) {
      return res.status(403).json({ 
        error: 'Account has been banned',
        message: 'Your account has been banned. Please contact admin.'
      });
    }
    
    req.user = decoded;
    
    logger.info(`User authenticated: ${decoded.email} (${decoded.type})`);
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error instanceof AuthenticationError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    logger.error(`Authentication error: ${error.message}`);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Require verified email middleware
 */
const requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.type === 'unverified') {
    return res.status(403).json({ 
      error: 'Email verification required',
      message: 'Please verify your email to perform this action'
    });
  }
  
  next();
};

/**
 * Require admin role middleware
 */
const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Verify user type from database (real-time check)
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/internal/users/${req.user.userId}`, {
      timeout: 2000
    });
    const userData = response.data;
    const actualType = userData.type;
    const tokenType = req.user.type;
    
    // If user type changed (promoted/demoted), force logout
    if (actualType !== tokenType) {
      return res.status(403).json({ 
        error: 'User role has changed',
        message: 'Your account role has been changed. Please log in again.'
      });
    }
    
    // Check if user is banned
    if (userData.active === false) {
      return res.status(403).json({ 
        error: 'Account has been banned',
        message: 'Your account has been banned. Please contact admin.'
      });
    }
    
    // Verify admin status
    if (!['admin', 'super_admin'].includes(actualType)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Update req.user with actual type
    req.user.type = actualType;
  } catch (error) {
    // If user service is unavailable, fall back to token-based check
    logger.warn(`Failed to verify user type from user service: ${error.message}`);
    if (!['admin', 'super_admin'].includes(req.user.type)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
  }
  
  next();
};

/**
 * Require super admin role middleware
 */
const requireSuperAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Verify user type from database (real-time check)
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/internal/users/${req.user.userId}`, {
      timeout: 2000
    });
    const userData = response.data;
    const actualType = userData.type;
    const tokenType = req.user.type;
    
    // If user type changed (promoted/demoted), force logout
    if (actualType !== tokenType) {
      return res.status(403).json({ 
        error: 'User role has changed',
        message: 'Your account role has been changed. Please log in again.'
      });
    }
    
    // Check if user is banned
    if (userData.active === false) {
      return res.status(403).json({ 
        error: 'Account has been banned',
        message: 'Your account has been banned. Please contact admin.'
      });
    }
    
    // Verify super admin status
    if (actualType !== 'super_admin') {
      return res.status(403).json({ error: 'Super admin access required' });
    }
    
    // Update req.user with actual type
    req.user.type = actualType;
  } catch (error) {
    // If user service is unavailable, fall back to token-based check
    logger.warn(`Failed to verify user type from user service: ${error.message}`);
    if (req.user.type !== 'super_admin') {
      return res.status(403).json({ error: 'Super admin access required' });
    }
  }
  
  next();
};

/**
 * Optional token verification (doesn't fail if no token)
 */
const optionalToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    // Token is invalid but we don't fail - just proceed without user
    logger.warn(`Invalid token provided: ${error.message}`);
  }
  
  next();
};

module.exports = {
  verifyToken,
  requireVerified,
  requireAdmin,
  requireSuperAdmin,
  optionalToken,
  AuthenticationError,
  AuthorizationError
};
