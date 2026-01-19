// Service configuration
module.exports = {
  auth: {
    url: process.env.AUTH_SERVICE_URL || 'http://auth-service:5000',
    prefix: '/api/auth'
  },
  user: {
    url: process.env.USER_SERVICE_URL || 'http://user-service:5001',
    prefix: '/api/users'
  },
  post: {
    url: process.env.POST_SERVICE_URL || 'http://post-reply-service:5002',
    prefix: '/api/posts'
  },
  history: {
    url: process.env.HISTORY_SERVICE_URL || 'http://history-service:5003',
    prefix: '/api/history'
  },
  message: {
    url: process.env.MESSAGE_SERVICE_URL || 'http://message-service:5004',
    prefix: '/api/messages'
  },
  file: {
    url: process.env.FILE_SERVICE_URL || 'http://file-service:5005',
    prefix: '/api/files'
  }
};
