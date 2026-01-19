# Gateway Service

API Gateway for the Forum Project - Routes requests to appropriate microservices.

## Architecture

This gateway follows **MVC (Model-View-Controller)** pattern with the following structure:

```
gateway/
├── server.js                 # Entry point
├── .env                      # Environment variables
├── package.json              # Dependencies
└── src/
    ├── config/               # Configuration files
    │   └── services.js       # Service URLs configuration
    ├── controllers/          # Proxy logic for each service
    │   ├── auth.controller.js
    │   ├── user.controller.js
    │   ├── post.controller.js
    │   ├── history.controller.js
    │   ├── message.controller.js
    │   └── file.controller.js
    ├── routes/               # Route definitions
    │   ├── index.js          # Main router
    │   ├── auth.routes.js
    │   ├── user.routes.js
    │   ├── post.routes.js
    │   ├── history.routes.js
    │   ├── message.routes.js
    │   └── file.routes.js
    ├── middlewares/          # Express middlewares
    │   ├── cors.middleware.js    # CORS configuration
    │   ├── error.middleware.js   # Error handling
    │   └── logger.middleware.js  # Request logging
    └── utils/                # Utility functions
        └── proxy.util.js     # Proxy helper
```

## Features

- **MVC Architecture**: Clean separation of concerns
- **CORS Enabled**: Configured to allow frontend requests from localhost:3000
- **Request Logging**: Automatic logging of all requests
- **Error Handling**: Global error handler with consistent responses
- **Service Proxy**: Automatic routing to backend microservices
- **Health Check**: `/health` endpoint for monitoring

## API Routes

| Route | Target Service | Port | Description |
|-------|---------------|------|-------------|
| `/api/auth/*` | auth-service | 5000 | Authentication & Authorization |
| `/api/users/*` | user-service | 5001 | User Data Management |
| `/api/posts/*` | post-reply-service | 5002 | Posts & Replies |
| `/api/history/*` | history-service | 5003 | Browsing History |
| `/api/messages/*` | message-service | 5004 | Contact Admin Messages |
| `/api/files/*` | file-service | 5005 | File Upload (S3) |
| `/health` | gateway | 8080 | Health check endpoint |

## Getting Started

### Install Dependencies

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
PORT=8080

# CORS - Allowed origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:3000

# Service URLs (Docker)
AUTH_SERVICE_URL=http://auth-service:5000
USER_SERVICE_URL=http://user-service:5001
POST_SERVICE_URL=http://post-reply-service:5002
HISTORY_SERVICE_URL=http://history-service:5003
MESSAGE_SERVICE_URL=http://message-service:5004
FILE_SERVICE_URL=http://file-service:5005
```

### Run the Gateway

```bash
# Production mode
npm start

# Development mode (with auto-reload)
npm run dev
```

The gateway will start on `http://localhost:8080`

## How It Works

### Request Flow

```
Client Request (Frontend @ localhost:3000)
    ↓
Gateway (localhost:8080)
    ↓
CORS Middleware (validates origin)
    ↓
Logger Middleware (logs request)
    ↓
Route Matching (/api/auth, /api/users, etc.)
    ↓
Controller (proxy configuration)
    ↓
Target Service (5000-5005) - Body parsing happens here
    ↓
Response to Client
```

**Important:** The gateway does NOT parse request bodies. Body parsing (JSON/form data) is handled by individual backend services. This ensures the request stream is not consumed before being proxied.

### Example Request

```bash
# Login request
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get user profile
curl http://localhost:8080/api/users/profile
```

## Architecture Decisions

### Why No Body Parsing at Gateway Level?

**The gateway does NOT use `express.json()` or `express.urlencoded()`.** Here's why:

**The Problem:**
```javascript
// ❌ This breaks proxying!
app.use(express.json());  // Consumes request stream
app.use('/api/auth', proxy);  // Proxy forwards empty body
```

When Express body parsers run:
1. They read the entire request stream
2. Parse it into `req.body`
3. The stream is now **consumed** (empty)
4. `http-proxy-middleware` tries to forward the request
5. Backend service receives an **empty body** ❌

**The Solution:**
```javascript
// ✅ Gateway forwards raw streams
app.use(corsMiddleware);
app.use(logger);
app.use('/api/auth', proxy);  // Proxy forwards full body stream
```

Backend services handle their own body parsing:
```javascript
// In auth-service (Flask)
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()  # Auth service parses body
    # ... handle login
```

**Benefits:**
- ✅ Request bodies arrive intact at backend services
- ✅ Gateway is a thin, fast routing layer
- ✅ Each service controls its own parsing strategy
- ✅ Follows microservices best practices

## Middleware

### CORS Middleware
Handles Cross-Origin Resource Sharing to allow frontend requests:
- **Allowed Origins**: Configurable via `ALLOWED_ORIGINS` environment variable
- **Default**: `http://localhost:3000` (React frontend)
- **Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Credentials**: Enabled (allows cookies)
- **Headers**: Content-Type, Authorization

To allow multiple origins, use comma-separated values:
```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://yourdomain.com
```

### Logger Middleware
Logs all incoming requests and response times:
```
[2026-01-18T...] POST /api/auth/login
[2026-01-18T...] POST /api/auth/login - 200 - 45ms
```

### Error Middleware
Catches all errors and returns consistent JSON responses:
```json
{
  "success": false,
  "error": {
    "message": "Service unavailable",
    "statusCode": 503,
    "timestamp": "2026-01-18T...",
    "path": "/api/auth/login"
  }
}
```

## Adding a New Service Route

1. **Create controller** in `src/controllers/`:
   ```javascript
   // src/controllers/newservice.controller.js
   const { createServiceProxy } = require('../utils/proxy.util');
   const serviceConfig = require('../config/services');

   const newServiceProxy = createServiceProxy(
     'NewService',
     'http://new-service:5006',
     '/api/newservice'
   );

   module.exports = { newServiceProxy };
   ```

2. **Create route** in `src/routes/`:
   ```javascript
   // src/routes/newservice.routes.js
   const express = require('express');
   const router = express.Router();
   const { newServiceProxy } = require('../controllers/newservice.controller');

   router.use('/', newServiceProxy);
   module.exports = router;
   ```

3. **Register route** in `src/routes/index.js`:
   ```javascript
   const newServiceRoutes = require('./newservice.routes');
   router.use('/api/newservice', newServiceRoutes);
   ```

## Testing

### Health Check
```bash
curl http://localhost:8080/health
```

Expected response:
```json
{
  "success": true,
  "message": "Gateway is running",
  "timestamp": "2026-01-18T...",
  "services": {
    "auth": "http://auth-service:5000",
    "user": "http://user-service:5001",
    ...
  }
}
```

## Troubleshooting

**Gateway not starting:**
- Check if port 8080 is available
- Ensure environment variables are set

**Service unavailable errors:**
- Verify backend services are running
- Check service URLs in `.env`
- Check Docker network connectivity

## License

ISC
