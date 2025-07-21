const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/user');
require('dotenv').config();

// Replace with your real wallet addresses
const WALLET_ADDRESSES = {
  eth: '0x7C1aeFd16F6C25C9399113192972f002FF338115',
  bsc: '0x7C1aeFd16F6C25C9399113192972f002FF338115'
};

// Show crypto address for payment
router.get('/get-address', (req, res) => {
  const { network } = req.query;
  if (!WALLET_ADDRESSES[network]) {
    return res.status(400).json({ error: 'Unsupported network' });
  }
  res.json({ address: WALLET_ADDRESSES[network] });
});

// Verify payment using Etherscan or BscScan
router.post('/verify-payment', async (req, res) => {
  const { txHash, userId, network } = req.body;

  try {
    let apiUrl = '';
    let apiKey = '';

    if (network === 'eth') {
      apiKey = process.env.ETHERSCAN_API_KEY;
      apiUrl = `https://api.etherscan.io/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}&apikey=${apiKey}`;
    } else if (network === 'bsc') {
      apiKey = process.env.BSCSCAN_API_KEY;
      apiUrl = `https://api.bscscan.com/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}&apikey=${apiKey}`;
    } else {
      return res.status(400).json({ error: 'Unsupported network' });
    }

    const result = await axios.get(apiUrl);
    const status = result.data?.result?.status;

    if (status === '1') {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      user.balance += 1; // Adjust based on your pricing logic
      await user.save();

      return res.json({ success: true, message: 'Payment confirmed, balance updated.' });
    } else {
      return res.status(400).json({ error: 'Payment not yet confirmed.' });
    }
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ error: 'Failed to verify transaction' });
  }
});

module.exports = router;

