const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Creates a proxy middleware for a given service
 * @param {string} serviceName - Name of the service (for logging)
 * @param {string} targetUrl - Target service URL
 * @param {string} pathPrefix - Path prefix to rewrite (e.g., '/api/auth')
 * @returns {Function} Express middleware function
 */
const createServiceProxy = (serviceName, targetUrl, pathPrefix) => {
  return createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: { [`^${pathPrefix}`]: '' },
    onProxyReq: (proxyReq, req) => {
      console.log(`[${serviceName} Proxy] ${req.method} ${req.path} -> ${targetUrl}${req.path.replace(pathPrefix, '')}`);
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
