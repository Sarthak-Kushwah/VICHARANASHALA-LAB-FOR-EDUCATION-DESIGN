import mongoose, { Document, Schema as MongooseSchema } from 'mongoose';
import type { ReputationAction } from './User.js';

export interface IReputationLog extends Document {
  userId: MongooseSchema.Types.ObjectId;
  delta: number;
  reason: string;
  action: ReputationAction;
  targetId?: MongooseSchema.Types.ObjectId;
  targetType?: string;
  awardedBy?: MongooseSchema.Types.ObjectId;
  createdAt: Date;
}

const reputationLogSchema = new MongooseSchema<IReputationLog>({
  userId: { type: MongooseSchema.Types.ObjectId, ref: 'User', required: true },
  delta: { type: Number, required: true },
  reason: { type: String, default: '' },
  action: { type: String, required: true },
  targetId: { type: MongooseSchema.Types.ObjectId },
  targetType: { type: String },
  awardedBy: { type: MongooseSchema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

reputationLogSchema.index({ userId: 1, createdAt: -1 });
reputationLogSchema.index({ userId: 1 });

export default mongoose.model<IReputationLog>('ReputationLog', reputationLogSchema, 'yaksha_faq_reputation_logs');
