// controllers/authController.js
const User = require('../models/User'); 
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 

const user = require('../models/User')

// @desc    Register a new Institution (Creates a new user record)
exports.registerInstitution = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'Institution already registered' });

        // 1. Hash the Password (CRITICAL SECURITY STEP)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ name, email, password: hashedPassword });

        // --- TEMPORARY DEBUGGING LOGS START HERE ---
        console.log("Attempting to save user with email:", user.email);

        await user.save();

        // --- TEMPORARY DEBUGGING LOG ENDS HERE ---
        
        console.log("SUCCESS: User saved to DB."); // Confirms write success!

        res.status(201).json({ msg: 'Registration successful! Please log in.' });
    } catch (err) {
        console.error("Mongoose Save Error:", err.message);
        res.status(500).send('Server Error during registration');
    }
};

// @desc    Authenticate User & Get Token (Checks password and issues JWT)
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        // 1. Compare the Hashed Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        // 2. Generate JWT (The secure access ticket)
        const payload = { user: { id: user.id, role: user.role } };

        jwt.sign(
            payload, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }, 
            (err, token) => {
                if (err) throw err;
                res.json({ token }); // Send the JWT to the Frontend team
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error during login');
    }
};