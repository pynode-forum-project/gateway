const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const postRoutes = require('./post.routes');
const historyRoutes = require('./history.routes');
const messageRoutes = require('./message.routes');
const fileRoutes = require('./file.routes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Gateway is running',
    timestamp: new Date().toISOString(),
    services: {
      auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:5000',
      user: process.env.USER_SERVICE_URL || 'http://user-service:5001',
      post: process.env.POST_SERVICE_URL || 'http://post-reply-service:5002',
      history: process.env.HISTORY_SERVICE_URL || 'http://history-service:5003',
      message: process.env.MESSAGE_SERVICE_URL || 'http://message-service:5004',
      file: process.env.FILE_SERVICE_URL || 'http://file-service:5005'
    }
  });
});

// Mount service routes
router.use('/api/auth', authRoutes);
router.use('/api/users', userRoutes);
router.use('/api/posts', postRoutes);
router.use('/api/history', historyRoutes);
router.use('/api/messages', messageRoutes);
router.use('/api/files', fileRoutes);

module.exports = router;
