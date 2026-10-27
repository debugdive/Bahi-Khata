import express from 'express';
import { getTodaysRoute, markAttendance, getDeliveryCustomers, addDeliveryCustomer, calculateAndGenerateBill } from '../controllers/deliveryController';
import protect from '../middleware/authMiddleware';
import authorize from '../middleware/roleMiddleware';

const router = express.Router();

router.use(protect);
// Allow both Delivery Business and Service Provider
router.use(authorize('Delivery Business', 'Service Provider'));

router.get('/todays-route', getTodaysRoute);
router.post('/attendance', markAttendance);
router.get('/customers', getDeliveryCustomers);
router.post('/customers', addDeliveryCustomer);
router.post('/calculate-bill', calculateAndGenerateBill);

export default router;
