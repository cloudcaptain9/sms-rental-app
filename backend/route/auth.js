const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Temporary in-memory store for reset codes
const resetCodes = {};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    res.json({
      userId: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      balance: user.balance,
      image_url: user.image_url
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ GET /api/auth/user/:id
router.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    res.json(user);
  } catch (err) {
    console.error('❌ Fetch user error:', err);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, phone, image_url, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      phone,
      image_url,
      passwordHash,
      balance: 0
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('❌ Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me?userId=<id>
router.get('/me', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ message: 'User ID is required' });

  try {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('❌ Fetch me error:', err);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// =============================
// ✅ Password Reset Endpoints
// =============================

// POST /api/auth/request-reset
router.post('/request-reset', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const code = Math.floor(100000 + Math.random() * 900000); // 6-digit code
    resetCodes[email] = { code, expiresAt: Date.now() + 10 * 60 * 1000 }; // 10 minutes

    // Send via email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"SMS Rental" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Your Password Reset Code',
      text: `Your SMS Rental password reset code is: ${code}`
    });

    res.json({ message: 'Reset code sent to email' });

  } catch (err) {
    console.error('❌ Request reset error:', err);
    res.status(500).json({ message: 'Failed to send reset code' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;

  try {
    const record = resetCodes[email];
    if (!record || record.code != code || Date.now() > record.expiresAt) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const hash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hash;
    await user.save();

    delete resetCodes[email]; // clean up
    res.json({ message: 'Password reset successful' });

  } catch (err) {
    console.error('❌ Reset password error:', err);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

module.exports = router;

