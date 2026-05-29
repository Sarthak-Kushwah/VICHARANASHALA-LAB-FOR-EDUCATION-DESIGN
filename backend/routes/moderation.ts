import { Router } from 'express';
import { adminOnly } from '../middleware/admin.js';
import { banUser, unbanUser, suspendUser, unsuspendUser, warnUser, softDeleteUser, getModerationLogs, getModerationQueue } from '../controllers/moderationController.js';

const router = Router();
router.use(adminOnly);

router.get('/queue', getModerationQueue);
router.get('/logs', getModerationLogs);
router.post('/ban', banUser);
router.post('/unban', unbanUser);
router.post('/suspend', suspendUser);
router.post('/unsuspend', unsuspendUser);
router.post('/warn', warnUser);
router.post('/soft-delete', softDeleteUser);

export default router;
