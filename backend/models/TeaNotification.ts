import mongoose, { Document, Schema as MongooseSchema, Types } from 'mongoose';

// A "tea drop" — one per new FAQ, per user
export interface ITeaNotification extends Document {
  userId: Types.ObjectId;
  faqId: Types.ObjectId;
  faqQuestion: string; // snapshot at creation time so it never goes stale
  read: boolean;
  createdAt: Date;
}

const teaNotificationSchema = new MongooseSchema(
  {
    userId: {
      type: MongooseSchema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    faqId: {
      type: MongooseSchema.Types.ObjectId,
      ref: 'FAQ',
      required: true,
    },
    faqQuestion: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Prevent duplicate drops for same user + FAQ
teaNotificationSchema.index({ userId: 1, faqId: 1 }, { unique: true });
// Fast read/unread queries
teaNotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.model<ITeaNotification>(
  'TeaNotification',
  teaNotificationSchema,
  'yaksha_faq_tea_notifications'
);