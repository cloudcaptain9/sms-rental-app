// backend/db.js
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/sms_rental";
const client = new MongoClient(uri);

let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(); // use default db from URI
    console.log("✅ MongoDB connected");
  }
  return db;
}

module.exports = connectDB;

