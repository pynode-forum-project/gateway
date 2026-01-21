const { createServiceProxy } = require('../utils/proxy.util');
const serviceConfig = require('../config/services');

// Create proxy middleware for User Service
const userProxy = createServiceProxy(
  'User',
  serviceConfig.user.url,
  serviceConfig.user.targetPrefix
);

module.exports = {
  userProxy
};
