// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', authController.registerInstitution);
// POST /api/auth/login
router.post('/login', authController.loginUser);

module.exports = router;