require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const verificationRoutes = require('./backend/route/verification');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/verification', verificationRoutes);
app.use("/api", require("./backend/route/webhook"));
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Load routes
const authRoutes = require('./backend/route/auth');
const rentRoutes = require('./backend/route/rent');
const adminRoutes = require('./backend/route/admin');
const cryptoRoute = require('./backend/route/crypto');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rent', rentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/crypto', cryptoRoute);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

