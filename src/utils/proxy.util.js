const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Creates a proxy middleware for a given service
 * @param {string} serviceName - Name of the service (for logging)
 * @param {string} targetUrl - Target service URL
 * @param {string} targetPrefix - Target path prefix for the backend service (e.g., '/auth' or '/api/users')
 * @returns {Function} Express middleware function
 */
const createServiceProxy = (serviceName, targetUrl, targetPrefix) => {
  return createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: (path) => targetPrefix + path,
    onProxyReq: (proxyReq, req) => {
      console.log(`[${serviceName} Proxy] ${req.method} ${req.path} -> ${targetUrl}${targetPrefix}${req.path}`);
    },
    onError: (err, req, res) => {
      console.error(`[${serviceName} Proxy Error] ${err.message}`);
      res.status(503).json({
        success: false,
        error: {
          message: `${serviceName} service unavailable`,
          statusCode: 503,
          timestamp: new Date().toISOString()
        }
      });
    }
  });
};

module.exports = {
  createServiceProxy
};
