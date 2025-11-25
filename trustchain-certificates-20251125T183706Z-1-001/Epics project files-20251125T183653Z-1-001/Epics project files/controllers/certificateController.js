// controllers/certificateController.js
const Certificate = require('../models/Certificate');
const crypto = require('crypto'); // Built-in Node.js library for hashing
const blockchainService = require('../services/blockchainService'); 

/**
 * @desc Handles the certificate issuance process: security check, hashing, DB write, and blockchain transaction.
 * @route POST /api/certs/issue
 * @access Private (Institution role only)
 */
exports.issueCertificate = async (req, res) => {
    // 1. Get user data from JWT token (provided by authMiddleware)
    const issuerId = req.user.id; 
    const { studentName, courseName, grade, issueDate } = req.body;
    
    // --- START MAIN TRY BLOCK ---
    try {
        // 1. Authorization Check (Ensures only Institutions can use this endpoint)
        if (req.user.role.toLowerCase() !== 'institution') {
            return res.status(403).json({ msg: 'Access denied. Only Institutions can issue certificates.' });
        }

        // 2. Data Hashing (Decoupling: Create the fingerprint before interacting with the blockchain)
        const uniqueData = JSON.stringify({ studentName, courseName, grade, issueDate, issuerId });
        const certificateHash = crypto.createHash('sha256').update(uniqueData).digest('hex');

        // 3. Database Write (Saves the data and hash first)
        const newCertificate = new Certificate({
            certificateHash,
            issuer: issuerId,
            studentName,
            courseName,
            grade,
            issueDate
        });
        await newCertificate.save(); // CRITICAL: Database write succeeds here

        // 4. Blockchain Interaction (This is where the crash was occurring)
        let txReceipt = {};
        try {
            // Call the Ethers.js service to send the transaction
            txReceipt = await blockchainService.recordHash(certificateHash);
        } catch (blockchainError) {
            // If the transaction fails (e.g., due to wrong private key, network error), 
            // we catch it here and return a success status, but with a warning.
            return res.status(200).json({ 
                msg: 'Certificate saved to database, but blockchain transaction failed.',
                status: 'DB_SAVED_BLOCKCHAIN_FAILED',
                certificateHash: certificateHash,
                error: blockchainError.message 
            });
        }
        
        // 5. Successful Final Response
        res.status(200).json({ 
            msg: 'Certificate issued successfully and transaction submitted.',
            status: 'COMPLETED',
            certificateHash: certificateHash,
            issuer: issuerId,
            transactionHash: txReceipt.transactionHash 
        });

    } catch (err) {
        // --- HANDLE NON-BLOCKCHAIN ERRORS ---
        
        // Handle MongoDB duplicate key error (E11000) - Occurs if the same certificate hash is issued twice
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Certificate already issued for this exact data set.' });
        }
        
        console.error(err.message);
        res.status(500).json({ msg: `Server Error: An unexpected error occurred.` });
    }
};

/**
 * @desc Implements the public verification API to check the blockchain record and retrieve details.
 * @route GET /api/certs/verify
 * @access Public
 */
exports.verifyCertificate = async (req, res) => {
    const { hash } = req.query;
    if (!hash) return res.status(400).json({ msg: "Hash parameter is required for verification." });

    try {
        // 1. Query the blockchain state to confirm issuance
        const verificationStatus = await blockchainService.verifyHash(hash);
        
        if (!verificationStatus.isRecorded) {
            return res.status(404).json({ msg: "Certificate hash not found on blockchain." });
        }
        
        // 2. Find corresponding data in MongoDB
        const cert = await Certificate.findOne({ certificateHash: hash }).populate('issuer', 'name');

        // --- ROBUST NULL CHECK START ---
        const issuerName = cert && cert.issuer ? cert.issuer.name : "Institution Details Missing in DB";
        const issuerEmail = cert && cert.issuer ? cert.issuer.email : "N/A";
        // --- ROBUST NULL CHECK END ---

        res.json({
            isVerified: true,
            msg: "Certificate successfully verified on blockchain.",
            issuerDetails: {
                name: issuerName,
                email: issuerEmail,
                address: verificationStatus.issuerAddress // The blockchain address
            },
            details: {
                studentName: cert ? cert.studentName : null,
                courseName: cert ? cert.courseName : null,
                // Only show full certificate details if record was found in MongoDB
                dbRecordFound: !!cert 
            }
        });
        
    } catch (err) {
        console.error("VERIFICATION CRASH ERROR:", err.message);
        // Return a generic 500 error, but log the specific error in the terminal
        // Return the generic 500 status back to Postman
    res.status(500).json({ 
        msg: 'Verification Failed: Server encountered a critical error.',
        details: err.message // Return the message to Postman for visibility
    });
    }
};