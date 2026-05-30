/**
 * createVectorIndex.ts
 *
 * Creates MongoDB Atlas vector search indexes for the FAQ and CommunityPost
 * embedding fields. Run ONCE after setting up your Atlas cluster — safe to
 * re-run; Atlas will no-op if the index already exists with the same name.
 *
 * Usage:
 *   npm run create:vector-index
 *
 * Atlas Vector Search reference:
 *   https://www.mongodb.com/docs/atlas/atlas-search/vector-search/
 *
 * Model: Xenova/multi-qa-mpnet-base-dot-v1 → 768-dimensional normalized vectors
 *   numDimensions MUST match the model output (768).
 *   If you switch the model, you must:
 *     1. Update embeddings.ts to use the new model slug
 *     2. Run backfillEmbeddings.ts to regenerate all stored vectors
 *     3. Drop and recreate this index with the new numDimensions
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();
dotenv.config({ path: '.env.local' });

const MONGO_URI = process.env.MONGODB_URI!;

if (!MONGO_URI) {
  console.error('MONGODB_URI is required');
  process.exit(1);
}

const DB_NAME = 'yaksha_faq';

async function createIndexes() {
  await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
  const db = mongoose.connection.db!;

  const faqCollection = db.collection('yaksha_faq_faqs');
  const postCollection = db.collection('yaksha_faq_communityposts');

  const VECTOR_INDEX = {
    name: 'vector_index',
    definition: {
      mappings: {
        vectorSearch: {
          dimensions: 768,
          similarity: 'dotProduct',
        },
      },
    },
  };

  console.log('\n[1/2] Ensuring vector index on yaksha_faq_faqs…');
  try {
    await faqCollection.createSearchIndex(VECTOR_INDEX);
    console.log('  → Created / updated faq vector_index');
  } catch (err: unknown) {
    const e = err as { code?: number; message?: string };
    if (e.code === 85 || e.code === 86 || e.message?.includes('already exists')) {
      console.log('  → faq vector_index already exists, skipping');
    } else {
      throw err;
    }
  }

  console.log('\n[2/2] Ensuring vector index on yaksha_faq_communityposts…');
  try {
    await postCollection.createSearchIndex({
      ...VECTOR_INDEX,
      // Community posts also store embeddings (same model, same dimensions)
    });
    console.log('  → Created / updated community vector_index');
  } catch (err: unknown) {
    const e = err as { code?: number; message?: string };
    if (e.code === 85 || e.code === 86 || e.message?.includes('already exists')) {
      console.log('  → community vector_index already exists, skipping');
    } else {
      throw err;
    }
  }

  // List all search indexes so the operator can verify
  console.log('\n[+] Current search indexes on yaksha_faq_faqs:');
  await faqCollection.listSearchIndexes().forEach((idx: Record<string, unknown>) => {
    console.log(`    ${(idx.name as string)} (type: ${idx.type as string})`);
  });

  console.log('\n[+] Current search indexes on yaksha_faq_communityposts:');
  await postCollection.listSearchIndexes().forEach((idx: Record<string, unknown>) => {
    console.log(`    ${(idx.name as string)} (type: ${idx.type as string})`);
  });

  console.log('\n✅ Vector index creation complete.');
  await mongoose.disconnect();
}

createIndexes().catch((err) => {
  console.error('\n❌ Failed to create vector index:', err);
  process.exit(1);
});