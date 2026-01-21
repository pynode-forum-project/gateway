const { createServiceProxy } = require('../utils/proxy.util');
const serviceConfig = require('../config/services');

// Create proxy middleware for Auth Service
const authProxy = createServiceProxy(
  'Auth',
  serviceConfig.auth.url,
  serviceConfig.auth.targetPrefix
);

module.exports = {
  authProxy
};
