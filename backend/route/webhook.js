const express = require('express');
const router = express.Router();
const Rental = require('../models/rental');
const User = require('../models/user');

// Twilio sends form data, not JSON
router.post('/twilio', async (req, res) => {
  const { From, To, Body } = req.body;

  console.log('📩 Incoming SMS:', { From, To, Body });

  try {
    // 1. Find rental record by Twilio number
    const rental = await Rental.findOne({ twilioNumber: To });

    if (!rental) {
      console.log('❌ No rental found for number:', To);
      return res.status(404).send('<Response></Response>');
    }

    // 2. Reject if expired
    if (rental.expiresAt && rental.expiresAt < new Date()) {
      console.log('⏱️ Rental expired for number:', To);
      return res.status(403).send('<Response></Response>');
    }

    // 3. Add incoming message
    rental.messages.push({ from: From, body: Body });

    // 4. Deduct balance only once
    if (!rental.codeReceived) {
      const user = await User.findById(rental.userId);
      if (user) {
        user.balance -= rental.price;
        await user.save();
      }

      rental.codeReceived = true;
    }

    await rental.save();

    res.set('Content-Type', 'text/xml');
    res.send('<Response></Response>');
  } catch (err) {
    console.error('❌ Webhook error:', err);
    res.set('Content-Type', 'text/xml');
    res.status(500).send('<Response></Response>');
  }
});

module.exports = router;

