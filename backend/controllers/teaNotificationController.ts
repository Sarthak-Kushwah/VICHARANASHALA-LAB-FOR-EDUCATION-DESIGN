import { Request, Response } from 'express';
import TeaNotification from '../models/TeaNotification.js';
import FAQ from '../models/FAQ.js';

/** Internal: create a tea drop for all non-admin users when a new FAQ is published */
export async function createTeaDropsForFAQ(faqId: string, faqQuestion: string): Promise<void> {
  try {
    const User = (await import('../models/User.js')).default;

    // Fan out to every logged-in user except admins/moderators
    const users = await User.find({ role: { $nin: ['admin', 'moderator'] } }).select('_id');
    const drops = users.map((u) => ({
      userId: u._id,
      faqId: new (require('mongoose').Types.ObjectId)(faqId),
      faqQuestion,
      read: false,
    }));

    // Upsert avoids duplicates even on retry
    for (const drop of drops) {
      await TeaNotification.findOneAndUpdate(
        { userId: drop.userId, faqId: drop.faqId },
        { $setOnInsert: drop },
        { upsert: true }
      );
    }
  } catch (err) {
    console.warn('createTeaDropsForFAQ failed:', (err as Error).message);
  }
}

// GET /api/tea/notifications — Get tea feed for the current user
export const getTeaNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [drops, total, unreadResult] = await Promise.all([
      TeaNotification.find({ userId: req.user!._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TeaNotification.countDocuments({ userId: req.user!._id }),
      TeaNotification.countDocuments({ userId: req.user!._id, read: false }),
    ]);

    res.json({
      drops,
      total,
      unreadCount: unreadResult,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasMore: skip + drops.length < total,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// GET /api/tea/unread-count — Get unread tea count
export const getTeaUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const count = await TeaNotification.countDocuments({
      userId: req.user!._id,
      read: false,
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// PATCH /api/tea/notifications/read-all — Mark all tea as read
export const markAllTeaAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    await TeaNotification.updateMany(
      { userId: req.user!._id, read: false },
      { read: true }
    );
    res.json({ message: 'All tea marked as read.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// PATCH /api/tea/notifications/:id/read — Mark one drop as read
export const markTeaAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const drop = await TeaNotification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!._id },
      { read: true },
      { new: true }
    );
    if (!drop) {
      res.status(404).json({ message: 'Tea drop not found.' });
      return;
    }
    res.json({ drop });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};