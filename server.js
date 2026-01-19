require("dotenv").config();
const express = require("express");
const corsMiddleware = require("./src/middlewares/cors.middleware");
const logger = require("./src/middlewares/logger.middleware");
const {
  errorHandler,
  notFoundHandler,
} = require("./src/middlewares/error.middleware");

const routes = require("./src/routes");

const app = express();
const PORT = process.env.PORT || 8080;

// Global middlewares
app.use(corsMiddleware); // CORS - must be first

// NOTE: We DO NOT parse request bodies (express.json/urlencoded) at gateway level
// Body parsing consumes the request stream, preventing http-proxy-middleware
// from forwarding the body to backend services. Backend services will handle
// their own body parsing.

app.use(logger); // Request logging

// Mount all routes
app.use("/", routes);

app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
  Gateway is running on Port:${PORT}                   
  Environment:  ${process.env.NODE_ENV || "development"}         
  Health Check: http://localhost:${PORT}/health
  CORS Enabled: ${process.env.ALLOWED_ORIGINS || "http://localhost:3000"} 
  • /api/auth     -> Auth Service (${
    process.env.AUTH_SERVICE_URL?.split("//")[1] || "auth-service:5000"
  })    ║
  • /api/users    -> User Service (${
    process.env.USER_SERVICE_URL?.split("//")[1] || "user-service:5001"
  })    ║
  • /api/posts    -> Post Service (${
    process.env.POST_SERVICE_URL?.split("//")[1] || "post-reply-service:5002"
  }) ║
  • /api/history  -> History Service (${
    process.env.HISTORY_SERVICE_URL?.split("//")[1] || "history-service:5003"
  }) ║
  • /api/messages -> Message Service (${
    process.env.MESSAGE_SERVICE_URL?.split("//")[1] || "message-service:5004"
  }) ║
  • /api/files    -> File Service (${
    process.env.FILE_SERVICE_URL?.split("//")[1] || "file-service:5005"
  })

  `);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\nSIGINT received, shutting down gracefully...");
  process.exit(0);
});
