const express = require('express');
const router = express.Router();
const User = require('../models/user'); // ✅ Use capital "U"

// Protect all admin routes with a password
router.use((req, res, next) => {
  const adminPassword = req.headers['x-admin-password'];
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Unauthorized: Invalid admin password' });
  }
  next();
});

// POST /api/admin/topup
router.post('/topup', async (req, res) => {
  const { userId, amount } = req.body;

  if (!userId || !amount) {
    return res.status(400).json({ message: 'userId and amount are required' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.balance += Number(amount);
    await user.save();

    res.json({
      message: `Balance updated successfully`,
      newBalance: user.balance,
    });
  } catch (err) {
    console.error('❌ Admin top-up error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('name email balance _id');
    res.json(users);
  } catch (err) {
    console.error('❌ Admin fetch users error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

