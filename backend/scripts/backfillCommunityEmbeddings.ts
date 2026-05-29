/**
 * Backfill only CommunityPost embeddings that are missing.
 * Run: npx tsx scripts/backfillCommunityEmbeddings.ts
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import CommunityPost from '../models/CommunityPost.js';
import { generateEmbedding } from '../utils/embeddings.js';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const posts = await CommunityPost.find({ $or: [{ embedding: { $exists: false } }, { embedding: null }] });

  for (const post of posts) {
    post.embedding = await generateEmbedding(`${post.title}. ${post.body}`);
    await post.save();
    console.log(`Updated ${post._id}: ${post.title.slice(0, 50)}`);
  }

  console.log(`\n✅ ${posts.length} posts updated.`);
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
