import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Badge from '../models/Badge.js';

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('Connected to MongoDB');
  await (Badge as any).seedDefaults();
  console.log('Badges seeded');
  await mongoose.disconnect();
}

seed().catch(console.error);
