const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const authMiddleware = require("../middleware/auth");
const logger = require("../utils/logger");

const router = express.Router();

// Service URLs from environment variables
const services = {
  auth: process.env.AUTH_SERVICE_URL || "http://localhost:5000",
  user: process.env.USER_SERVICE_URL || "http://localhost:5001",
  post: process.env.POST_SERVICE_URL || "http://localhost:5002",
  history: process.env.HISTORY_SERVICE_URL || "http://localhost:5003",
  message: process.env.MESSAGE_SERVICE_URL || "http://localhost:5004",
  file: process.env.FILE_SERVICE_URL || "http://localhost:5005",
};

// Proxy options factory
const createProxy = (target, pathRewrite = {}) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    onProxyReq: (proxyReq, req) => {
      // Forward user info from JWT if available
      if (req.user) {
        proxyReq.setHeader("X-User-Id", req.user.userId);
        proxyReq.setHeader("X-User-Type", req.user.type);
        proxyReq.setHeader("X-User-Email", req.user.email);
      }
      // Handle body for POST/PUT requests
      // Skip body manipulation for multipart/form-data (file uploads)
      const contentType = req.headers["content-type"] || "";
      if (contentType.includes("multipart/form-data")) {
        // Let http-proxy-middleware handle the stream automatically
        return;
      }
      // For JSON requests, write the body if it exists
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onError: (err, req, res) => {
      logger.error(`Proxy error: ${err.message}`);
      res
        .status(502)
        .json({ error: "Service unavailable", message: err.message });
    },
  });
};

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Auth routes - login, register
router.post("/auth/login", createProxy(services.auth, { "^/api/auth": "" }));
router.post("/auth/register", createProxy(services.auth, { "^/api/auth": "" }));
router.post(
  "/auth/verify-email",
  createProxy(services.auth, { "^/api/auth": "" }),
);
router.post(
  "/auth/resend-verification",
  createProxy(services.auth, { "^/api/auth": "" }),
);
router.post(
  "/auth/refresh-token",
  createProxy(services.auth, { "^/api/auth": "" }),
);

// Contact us - accessible to everyone
router.post("/messages", createProxy(services.message, { "^/api": "" }));

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// Apply auth middleware to all routes below
router.use(authMiddleware.verifyToken);

// User routes
router.get(
  "/users",
  authMiddleware.requireAdmin,
  createProxy(services.user, { "^/api": "" }),
);
router.get("/users/:id", createProxy(services.user, { "^/api": "" }));
router.put("/users/:id", createProxy(services.user, { "^/api": "" }));
router.put(
  "/users/:id/profile-image",
  createProxy(services.user, { "^/api": "" }),
);
router.put(
  "/users/:id/ban",
  authMiddleware.requireAdmin,
  createProxy(services.user, { "^/api": "" }),
);
router.put(
  "/users/:id/unban",
  authMiddleware.requireAdmin,
  createProxy(services.user, { "^/api": "" }),
);
router.put(
  "/users/:id/promote",
  authMiddleware.requireSuperAdmin,
  createProxy(services.user, { "^/api": "" }),
);
router.put(
  "/users/:id/demote",
  authMiddleware.requireSuperAdmin,
  createProxy(services.user, { "^/api": "" }),
);
router.delete(
  "/users/:id",
  authMiddleware.requireSuperAdmin,
  createProxy(services.user, { "^/api": "" }),
);

// Post routes
router.get("/posts", createProxy(services.post, { "^/api": "" }));
router.post(
  "/posts",
  authMiddleware.requireVerified,
  createProxy(services.post, { "^/api": "" }),
);
router.get("/posts/drafts", createProxy(services.post, { "^/api": "" }));
router.get(
  "/posts/banned",
  authMiddleware.requireAdmin,
  createProxy(services.post, { "^/api": "" }),
);
router.get(
  "/posts/deleted",
  authMiddleware.requireAdmin,
  createProxy(services.post, { "^/api": "" }),
);
router.get("/posts/:id", createProxy(services.post, { "^/api": "" }));
router.put("/posts/:id", createProxy(services.post, { "^/api": "" }));
router.put("/posts/:id/status", createProxy(services.post, { "^/api": "" }));
router.put("/posts/:id/archive", createProxy(services.post, { "^/api": "" }));
router.put(
  "/posts/:id/ban",
  authMiddleware.requireAdmin,
  createProxy(services.post, { "^/api": "" }),
);
router.put(
  "/posts/:id/unban",
  authMiddleware.requireAdmin,
  createProxy(services.post, { "^/api": "" }),
);
router.put(
  "/posts/:id/recover",
  authMiddleware.requireAdmin,
  createProxy(services.post, { "^/api": "" }),
);
router.delete("/posts/:id", createProxy(services.post, { "^/api": "" }));

// Reply routes
router.get(
  "/posts/:postId/replies",
  createProxy(services.post, {
    "^/api/posts/([^/]+)/replies": "/replies/post/$1",
  }),
);
router.post(
  "/posts/:postId/replies",
  authMiddleware.requireVerified,
  createProxy(services.post, {
    "^/api/posts/([^/]+)/replies": "/replies/post/$1",
  }),
);
router.post(
  "/replies/:replyId/sub",
  authMiddleware.requireVerified,
  createProxy(services.post, {
    "^/api/replies/([^/]+)/sub": "/replies/$1/sub",
  }),
);
router.delete(
  "/replies/:parentReplyId/nested",
  authMiddleware.verifyToken,
  createProxy(services.post, {
    "^/api/replies/([^/]+)/nested": "/replies/$1/nested",
  }),
);
router.delete(
  "/replies/:id",
  createProxy(services.post, {
    "^/api/replies/([^/]+)": "/replies/$1",
  }),
);

// User's top posts
router.get(
  "/users/:id/top-posts",
  createProxy(services.post, {
    "^/api/users/(\\d+)/top-posts": "/posts/user/$1/top",
  }),
);

// History routes (require authentication)
router.post("/history", authMiddleware.verifyToken, createProxy(services.history, { "^/api": "" }));
router.get(
  "/users/:id/history",
  authMiddleware.verifyToken,
  createProxy(services.history, { "^/api": "" }),
);
router.get(
  "/users/:id/history/search",
  authMiddleware.verifyToken,
  createProxy(services.history, { "^/api": "" }),
);

// Message routes (Admin only for GET)
router.get(
  "/messages",
  authMiddleware.requireAdmin,
  createProxy(services.message, { "^/api": "" }),
);
router.put(
  "/messages/:id/status",
  authMiddleware.requireAdmin,
  createProxy(services.message, { "^/api": "" }),
);

// File routes
router.post(
  "/files/upload",
  authMiddleware.requireVerified,
  createProxy(services.file, { "^/api": "" }),
);
// Use wildcard to match full path including slashes (e.g., profile/123/uuid.jpg)
// The * matches everything after /files/, and we rewrite /api/files/xxx to /files/xxx
router.get(
  "/files/*",
  createProxy(services.file, {
    "^/api": "",
  }),
);
router.delete(
  "/files/*",
  createProxy(services.file, {
    "^/api": "",
  }),
);

module.exports = router;
