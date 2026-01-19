const { createServiceProxy } = require('../utils/proxy.util');
const serviceConfig = require('../config/services');

// Create proxy middleware for Post Service
const postProxy = createServiceProxy(
  'Post',
  serviceConfig.post.url,
  serviceConfig.post.prefix
);

module.exports = {
  postProxy
};
