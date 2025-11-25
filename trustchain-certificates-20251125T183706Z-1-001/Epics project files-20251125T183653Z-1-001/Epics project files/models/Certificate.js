// models/Certificate.js
const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
    // CRITICAL: This hash is the unique, permanent proof stored on the blockchain
    certificateHash: { type: String, required: true, unique: true }, 

    // Links the certificate back to the issuing Institution
    issuer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Refers to the User model you created
        required: true
    },

    // Student and Course Details
    studentName: { type: String, required: true },
    courseName: { type: String, required: true },
    issueDate: { type: Date, default: Date.now },

    // Status fields
    isVerified: { type: Boolean, default: false } // Status determined by Blockchain
});

module.exports = mongoose.model('Certificate', CertificateSchema);