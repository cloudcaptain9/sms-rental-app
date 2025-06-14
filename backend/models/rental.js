const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
  twilioNumber: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: Date,
});

module.exports = mongoose.model('rental', rentalSchema);

