// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // IMPORTANT: We store the HASHED password
    password: { type: String, required: true }, 
    // Crucial for authorization (only 'Institution' role can issue)
    role: { type: String, default: 'Institution' }, 
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);