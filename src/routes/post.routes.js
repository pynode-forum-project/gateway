const express = require('express');
const router = express.Router();
const { postProxy } = require('../controllers/post.controller');

// All /api/posts/* requests are proxied to Post Service
router.use('/', postProxy);

module.exports = router;
