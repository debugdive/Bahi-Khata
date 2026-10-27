import express from 'express';
import { getAdminStats, getAdminUsers, toggleUserStatus } from '../controllers/adminController';
import protect from '../middleware/authMiddleware';
import authorize from '../middleware/roleMiddleware';

const router = express.Router();

router.use(protect);
router.use(authorize('Admin'));

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.patch('/users/:id/status', toggleUserStatus);

export default router;
