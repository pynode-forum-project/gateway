const { createServiceProxy } = require('../utils/proxy.util');
const serviceConfig = require('../config/services');

// Create proxy middleware for File Service
const fileProxy = createServiceProxy(
  'File',
  serviceConfig.file.url,
  serviceConfig.file.targetPrefix
);

module.exports = {
  fileProxy
};
