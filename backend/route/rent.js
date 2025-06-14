const express = require('express');
const router = express.Router();
const Rental = require('../models/rental');
const User = require('../models/user');
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// POST /api/rent — rent a number
router.post('/', async (req, res) => {
  const { userId, platform, region } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user || user.balance <= 0) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Get a number from Twilio
    const available = await client.availablePhoneNumbers(region || 'US')
      .local
      .list({ smsEnabled: true, limit: 1 });

    if (!available.length) {
      return res.status(500).json({ message: 'No numbers available' });
    }

    const number = await client.incomingPhoneNumbers.create({
      phoneNumber: available[0].phoneNumber,
      smsUrl: `${process.env.BASE_URL}/api/webhook/twilio`
    });

    const price = 1; // You can expand this with platform-specific pricing

    const rental = new Rental({
      twilioNumber: number.phoneNumber,
      user: user._id,
      messages: [],
      codeReceived: false,
      price,
      platform,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 20 * 60 * 1000) // 20 mins
    });

    await rental.save();

    res.json({ message: 'Number rented successfully', number: number.phoneNumber });
  } catch (err) {
    console.error('❌ Rent error:', err);
    res.status(500).json({ message: 'Error renting number' });
  }
});

// ✅ GET /api/rent/active/:userId — fetch all active (not expired) rentals
router.get('/active/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const rentals = await Rental.find({
      user: userId,
      expiresAt: { $gt: new Date() } // still active
    });

    res.json(rentals);
  } catch (err) {
    console.error('❌ Fetch active rentals error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

