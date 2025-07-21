require('dotenv').config();

const mongoose = require('mongoose');
const Rental = require('./backend/models/rental'); // ✅ Correct path

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const incomingTo = '+19705109988'; // Replace with number that received the SMS

  const rental = await Rental.findOne({
    twilioNumber: incomingTo,
    expiresAt: { $gt: new Date() }
  });

  if (!rental) {
    console.log('❌ No active rental found for:', incomingTo);
  } else {
    console.log('✅ Rental found:', rental);
  }

  mongoose.disconnect();
});

