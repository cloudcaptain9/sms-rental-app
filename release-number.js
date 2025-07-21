const twilio = require('twilio');

// Use environment variables if you prefer
require('dotenv').config(); // add this line to load .env

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);

async function releaseTrialNumber() {
  try {
    const numbers = await client.incomingPhoneNumbers.list();
    if (numbers.length === 0) {
      console.log('❌ No numbers to release.');
      return;
    }

    for (const number of numbers) {
      await client.incomingPhoneNumbers(number.sid).remove();
      console.log(`✅ Released number: ${number.phoneNumber}`);
    }
  } catch (err) {
    console.error('❌ Failed to release number:', err.message);
  }
}

releaseTrialNumber();

