const express = require('express');
const router = express.Router();
const axios = require('axios');

const TEXTVERIFIED_BASE_URL = 'https://www.textverified.com';
const TEXTVERIFIED_API_KEY = process.env.TEXTVERIFIED_API_KEY;
const TEXTVERIFIED_EMAIL = process.env.TEXTVERIFIED_EMAIL;

// Simple in-memory cache for bearer token
let tokenCache = null;
let tokenExpiresAt = null;

const generateBearerToken = async () => {
  const isExpired = () => {
    return !tokenCache || !tokenExpiresAt || new Date() >= new Date(tokenExpiresAt);
  };

  if (!isExpired()) {
    console.log('Using cached token:', tokenCache);
    return tokenCache;
  }

  try {
    const response = await axios.post(`${TEXTVERIFIED_BASE_URL}/api/pub/v2/auth`, {}, {
      headers: {
        'X-API-KEY': TEXTVERIFIED_API_KEY,
        'X-API-USERNAME': TEXTVERIFIED_EMAIL
      }
    });
    console.log('New token fetched:', response.data.token);
    tokenCache = response.data.token;
    tokenExpiresAt = response.data.expiresAt;
    return tokenCache;
  } catch (err) {
    console.error('Failed to fetch token:', err.response?.data || err.message);
    throw err;
  }
};

// GET /services — fetch available services and countries
router.get('/services', async (req, res) => {
  try {
    const token = await generateBearerToken();

    const serviceRes = await axios.get(`${TEXTVERIFIED_BASE_URL}/api/pub/v2/services`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        numberType: 'mobile',
        reservationType: 'verification'
      }
    });

console.log('💡 serviceRes.data:', serviceRes.data);
console.log('✅ isArray:', Array.isArray(serviceRes.data));
    const services = Array.isArray(serviceRes.data) ? serviceRes.data : [];

    const countries = [
      { code: 'us', name: 'United States' },
      { code: 'ca', name: 'Canada' },
      { code: 'gb', name: 'United Kingdom' },
      { code: 'de', name: 'Germany' },
      { code: 'fr', name: 'France' },
      { code: 'au', name: 'Australia' }
    ];

    res.json({
      services,
      countries
    });
  } catch (err) {
    console.error('🔴 Error fetching services or countries:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch services and countries' });
  }
});

// POST /create — create a new verification
router.post('/create', async (req, res) => {
  const { serviceName, capability } = req.body;

  try {
    const token = await generateBearerToken();
    const response = await axios.post(`${TEXTVERIFIED_BASE_URL}/api/pub/v2/verifications`, {
      serviceName,
      capability
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({ href: response.data.href });
  } catch (err) {
    console.error('Create Verification Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create verification' });
  }
});

// GET /status — poll verification status
router.get('/status', async (req, res) => {
  const { href } = req.query;

  try {
    const token = await generateBearerToken();
    const response = await axios.get(href, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    res.json(response.data);
  } catch (err) {
    console.error('Get Verification Status Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to get verification status' });
  }
});

module.exports = router;

