const express = require('express');
const router = express.Router();
const { authProxy } = require('../controllers/auth.controller');

router.use('/', authProxy);

module.exports = router;
