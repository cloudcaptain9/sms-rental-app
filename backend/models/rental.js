const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
  twilioNumber: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  messages: [
    {
      from: String,
      body: String,
      receivedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  codeReceived: {
    type: Boolean,
    default: false,
  },
  price: {
    type: Number,
    default: 1,
  },
  platform: String,
  number: String,         // add actual rented number
  rentalId: String,       // 5sim rental ID
  service: String,        // facebook, telegram, etc.
  country: String,
  status: {
    type: String,
    enum: ['pending', 'rented', 'completed', 'cancelled', 'expired'],
    default: 'pending'
  },
  smsCode: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Rental', rentalSchema);

