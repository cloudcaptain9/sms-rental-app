const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const connectDB = require("../db");

router.post("/webhook", async (req, res) => {
  const db = await connectDB();
  const users = db.collection("users");
  const rentals = db.collection("rented_numbers");

  try {
    const { otp_id, messages } = req.body;
    const latestMessage = messages?.[messages.length - 1]?.content;

    if (!otp_id || !latestMessage) {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    const rental = await rentals.findOne({ otp_id });
    if (!rental || rental.status === "received") {
      return res.status(404).json({ error: "Rental not found or already completed" });
    }

    const user = await users.findOne({ _id: new ObjectId(rental.user_id) });
    if (!user) return res.status(404).json({ error: "User not found" });

    const cost = rental.price;
    const newBalance = user.balance - cost;
    if (newBalance < 0) return res.status(400).json({ error: "Insufficient balance" });

    await rentals.updateOne(
      { _id: rental._id },
      { $set: { status: "received", code: latestMessage, received_at: new Date() } }
    );

    await users.updateOne(
      { _id: user._id },
      { $set: { balance: newBalance } }
    );

    res.status(200).json({ message: "Code saved and balance deducted" });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

