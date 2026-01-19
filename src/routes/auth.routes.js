const express = require('express');
const router = express.Router();
const { authProxy } = require('../controllers/auth.controller');

// All /api/auth/* requests are proxied to Auth Service
router.use('/', authProxy);

module.exports = router;
