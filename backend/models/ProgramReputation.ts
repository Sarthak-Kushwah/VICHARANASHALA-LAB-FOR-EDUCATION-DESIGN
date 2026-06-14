/**
 * ProgramReputation — v1.69
 *
 * Per-user-per-program reputation snapshot. Replaces the
 * program-agnostic `User.points / User.tier / User.sp` aggregation
 * (which still exists for backwards compat / cross-program display).
 *
 * Writes:
 *   - Rep awarded for a Q&A action in program X → increment
 *     `ProgramReputation(user=X, program=X).points`
 *   - Sp awarded for the same action → increment `.sp`
 *   - Tier change is computed from `points` on read (same thresholds
 *     as the global User tier scheme), so we don't store a
 *     redundant `tier` field
 *
 * Reads (Phase 7):
 *   - Per-program leaderboard: `find({ batchId }).sort({ points: -1 })`
 *   - User's profile in a program: `findOne({ userId, batchId })`
 *
 * The `lastGoldenTicketAt` / `lastGoldenRejectionAt` are
 * denormalised on this doc (not on User) so the cooldown logic
 * in Phase 7 can do a single read instead of joining across
 * collections.
 */

import mongoose, { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type ProgramTier = 'newcomer' | 'contributor' | 'expert' | 'top_contributor' | 'legend';

export interface IProgramReputation extends Document {
  userId: Types.ObjectId;
  batchId: Types.ObjectId;
  points: number;
  sp: number;
  /** Denormalised; recomputed on every write. Cheap to keep in sync. */
  tier: ProgramTier;
  acceptedAnswers: number;
  faqContributions: number;
  /** Denormalised so the Golden Ticket cooldown is a single read. */
  lastGoldenTicketAt: Date | null;
  lastGoldenRejectionAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tier thresholds — mirror the (legacy) global User tier scheme
 * so a user's "global" tier (sum across programs) is at least
 * approximately comparable to their per-program tier. Phase 7 will
 * decide whether to keep these in lockstep or diverge.
 */
export const TIER_THRESHOLDS: Array<{ tier: ProgramTier; minPoints: number }> = [
  { tier: 'newcomer',         minPoints: 0 },
  { tier: 'contributor',      minPoints: 50 },
  { tier: 'expert',           minPoints: 200 },
  { tier: 'top_contributor',  minPoints: 500 },
  { tier: 'legend',           minPoints: 2500 },
];

function computeTier(points: number): ProgramTier {
  let current: ProgramTier = 'newcomer';
  for (const t of TIER_THRESHOLDS) if (points >= t.minPoints) current = t.tier;
  return current;
}

const programReputationSchema = new MongooseSchema<IProgramReputation>(
  {
    userId: {
      type: MongooseSchema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    batchId: {
      type: MongooseSchema.Types.ObjectId,
      ref: 'Batch',
      required: true,
      index: true,
    },
    points: { type: Number, default: 0, min: 0 },
    sp: { type: Number, default: 0, min: 0 },
    tier: { type: String, enum: ['newcomer', 'contributor', 'expert', 'top_contributor', 'legend'] as ProgramTier[], default: 'newcomer' },
    acceptedAnswers: { type: Number, default: 0, min: 0 },
    faqContributions: { type: Number, default: 0, min: 0 },
    lastGoldenTicketAt: { type: Date, default: null },
    lastGoldenRejectionAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// A user has at most one reputation record per program.
programReputationSchema.index({ userId: 1, batchId: 1 }, { unique: true });

// Per-program leaderboard: "who has the most points in program X?"
// — the hot path for /leaderboard. Compound index because the
// front page sorts by `points` desc within a single program.
programReputationSchema.index({ batchId: 1, points: -1 });

// v1.69 — pre-save: keep `tier` consistent with `points` so
// reads don't have to compute it. Free, since the hook is the only
// write path during Phase 7.
programReputationSchema.pre('save', function (next) {
  if (this.isModified('points')) {
    this.tier = computeTier(this.points);
  }
  next();
});

export default mongoose.model<IProgramReputation>(
  'ProgramReputation',
  programReputationSchema,
  'yaksha_program_reputation'
);
