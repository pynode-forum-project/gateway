// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.message}`, err.stack);

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
};

// 404 Not Found handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      statusCode: 404,
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
