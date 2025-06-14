const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');

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

// ✅ GET /api/auth/user/:id - Moved outside login route
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

module.exports = router;

