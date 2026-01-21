const { createServiceProxy } = require('../utils/proxy.util');
const serviceConfig = require('../config/services');

// Create proxy middleware for Message Service
const messageProxy = createServiceProxy(
  'Message',
  serviceConfig.message.url,
  serviceConfig.message.targetPrefix
);

module.exports = {
  messageProxy
};
