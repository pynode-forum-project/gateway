const { createServiceProxy } = require('../utils/proxy.util');
const serviceConfig = require('../config/services');

// Create proxy middleware for History Service
const historyProxy = createServiceProxy(
  'History',
  serviceConfig.history.url,
  serviceConfig.history.targetPrefix
);

module.exports = {
  historyProxy
};
