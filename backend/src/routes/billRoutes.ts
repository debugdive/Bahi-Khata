import express from 'express';
import { generateBill, getBills, downloadBillPDF } from '../controllers/billController';
import protect from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getBills)
    .post(generateBill);

router.get('/:id/pdf', downloadBillPDF);

export default router;
