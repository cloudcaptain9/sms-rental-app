// backend/route/rent.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

const BACKEND_URL = 'http://localhost:3000';

router.get('/services', async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/verification/services`);
    const raw = response.data;

    // Transform and markup price
    const services = raw.services.map(service => ({
      name: service.name,
      code: service.code
    }));

    const countries = raw.countries.map(country => ({
      name: country.name,
      code: country.code
    }));

    res.json({ services, countries });
  } catch (err) {
    console.error('🔴 Failed to load services and countries:', err.message);
    res.status(500).json({ error: 'Failed to load services and countries' });
  }
});

router.get('/price', async (req, res) => {
  const { service, country } = req.query;
  try {
    const response = await axios.get(`${BACKEND_URL}/api/verification/services`);
    const { services } = response.data;

    const found = services.find(s => s.code === service && s.country === country);
    if (!found) return res.status(404).json({ error: 'Service not found' });

    // Add 50% markup
    const price = Math.ceil(found.price * 1.5);
    res.json({ price });
  } catch (err) {
    console.error('🔴 Failed to get price:', err.message);
    res.status(500).json({ error: 'Failed to fetch price' });
  }
});

module.exports = router;

