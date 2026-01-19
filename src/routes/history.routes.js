const express = require('express');
const router = express.Router();
const { historyProxy } = require('../controllers/history.controller');

// All /api/history/* requests are proxied to History Service
router.use('/', historyProxy);

module.exports = router;
