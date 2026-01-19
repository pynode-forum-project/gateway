const express = require('express');
const router = express.Router();
const { messageProxy } = require('../controllers/message.controller');

// All /api/messages/* requests are proxied to Message Service
router.use('/', messageProxy);

module.exports = router;
