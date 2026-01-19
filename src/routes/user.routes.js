const express = require('express');
const router = express.Router();
const { userProxy } = require('../controllers/user.controller');

// All /api/users/* requests are proxied to User Service
router.use('/', userProxy);

module.exports = router;
