import mongoose, { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type FAQStatus = 'pending' | 'approved' | 'rejected';

export interface IFAQ extends Document {
  question: string;
  answer: string;
  category: string;
  embedding?: number[];
  searchCount: number;
  status: FAQStatus;
  views: number;
  helpfulVotes: number;
  unhelpfulVotes: number;
  createdBy: Types.ObjectId | null;
  reports: Array<{
    reportedBy: Types.ObjectId;
    reason: string;
    createdAt?: Date; // Mongoose applies default automatically
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const faqSchema = new MongooseSchema(
  {
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
    },
    answer: {
      type: String,
      required: [true, 'Answer is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    embedding: {
      type: [Number],
      default: undefined,
      select: false,
    },
    searchCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'] as FAQStatus[],
      default: 'approved',
    },
    views: {
      type: Number,
      default: 0,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
    },
    unhelpfulVotes: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: MongooseSchema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reports: {
      type: [{
        reportedBy: { type: MongooseSchema.Types.ObjectId, ref: 'User' },
        reason: { type: String, trim: true },
        createdAt: { type: Date, default: Date.now },
      }],
      default: [],
    },
  },
  { timestamps: true }
);

faqSchema.index({ question: 'text', answer: 'text' });

export default mongoose.model<IFAQ>('FAQ', faqSchema, 'yaksha_faq_faqs');