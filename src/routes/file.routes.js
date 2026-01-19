const express = require('express');
const router = express.Router();
const { fileProxy } = require('../controllers/file.controller');

// All /api/files/* requests are proxied to File Service
router.use('/', fileProxy);

module.exports = router;
