import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("No MONGODB_URI found.");
  process.exit(1);
}

async function verifyUser() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('bantaybayan');

    const result = await db.collection('accounts').updateOne(
      { username: 'testcitizen' },
      { $set: { isVerified: true, verificationStatus: 'verified' } }
    );

    if (result.matchedCount > 0) {
      console.log("User 'testcitizen' has been successfully verified.");
    } else {
      console.log("User 'testcitizen' not found in database. Make sure you've signed up first!");
    }
  } catch (err) {
    console.error("Database error:", err);
  } finally {
    await client.close();
  }
}

verifyUser();
