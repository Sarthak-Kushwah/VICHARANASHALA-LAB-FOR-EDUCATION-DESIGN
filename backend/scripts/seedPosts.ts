/**
 * Seed sample community posts with embeddings.
 * Run: npx tsx scripts/seedPosts.ts
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import CommunityPost from '../models/CommunityPost.js';
import User from '../models/User.js';
import { generateEmbedding } from '../utils/embeddings.js';

interface SamplePost { title: string; body: string; status: string; answer: string | null; }

const samplePosts: SamplePost[] = [
  { title: 'Do I need to attend all team standups?', body: 'My team has daily standups at 9 AM but my timezone makes it hard. Is attendance strictly mandatory?', status: 'answered', answer: 'Standups are generally expected unless you have a prior arrangement with your manager.' },
  { title: 'Project documentation – is there a specific format required?', body: 'I want to start writing my project documentation. Is there a template I should follow?', status: 'unanswered', answer: null },
  { title: 'Can I work on side features outside the assigned project scope?', body: 'I have ideas beyond my current task. Should I implement them anyway?', status: 'answered', answer: 'Always complete core tasks first. Discuss side features with your mentor before starting.' },
  { title: 'How to request time off during the internship?', body: 'I have a family event next month. What is the process for taking a few days off?', status: 'answered', answer: 'Submit a PTO request through the HR portal at least 2 weeks in advance.' },
  { title: 'When do we get access to the production servers?', body: 'I need to debug a live issue but I do not have SSH access to production yet.', status: 'unanswered', answer: null },
];

async function seedPosts() {
  await mongoose.connect(process.env.MONGODB_URI!);
  let author = await User.findOne({ email: 'reg@yaksha.com' }) ?? (await User.findOne());
  if (!author) { console.log('No user found. Run seed.ts first.'); process.exit(1); }

  await CommunityPost.deleteMany({});
  console.log('Cleared existing posts.');

  for (const post of samplePosts) {
    const embedding = await generateEmbedding(`Question: ${post.title}. Description: ${post.body}. Answer: ${post.answer ?? ''}`);
    await CommunityPost.create({ ...post, author: author._id, embedding });
    console.log(`  + ${post.title}`);
  }

  console.log(`\n✅ Inserted ${samplePosts.length} posts.`);
  await mongoose.disconnect();
  process.exit(0);
}

seedPosts().catch((err) => { console.error(err); process.exit(1); });
