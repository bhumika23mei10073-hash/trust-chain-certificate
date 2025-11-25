// routes/certificate.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware'); 
const certController = require('../controllers/certificateController'); // We define this next

// POST /api/certs/issue - PROTECTED ROUTE! Must have a valid JWT token
router.post('/issue', auth, certController.issueCertificate); 

// GET /api/certs/verify - PUBLIC ROUTE! Does NOT need 'auth' middleware
// router.get('/verify', certController.verifyCertificate); 

// GET /api/certs/verify - PUBLIC ROUTE (THE MISSING ONE)
router.get('/verify', certController.verifyCertificate); 

module.exports = router;