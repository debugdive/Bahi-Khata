import express from 'express';
import { 
    getCustomerDashboard, 
    getCustomerBills, 
    getCustomerSubscriptions, 
    getCustomerPayments, 
    payAll,
    pauseSubscription,
    requestExtra
} from '../controllers/customerController';
import protect from '../middleware/authMiddleware';
import authorize from '../middleware/roleMiddleware';

const router = express.Router();

router.use(protect);
router.use(authorize('Customer'));

router.get('/dashboard', getCustomerDashboard);
router.get('/bills/:businessId', getCustomerBills);
router.get('/subscriptions', getCustomerSubscriptions);
router.post('/subscriptions/:id/pause', pauseSubscription);
router.post('/subscriptions/:id/extra', requestExtra);
router.get('/payments', getCustomerPayments);
router.post('/pay-all', payAll);

export default router;
