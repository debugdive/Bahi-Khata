import express from 'express';
import { getDashboardStats, getProducts, addProduct, getShopCustomers, addShopCustomer } from '../controllers/shopController';
import protect from '../middleware/authMiddleware';
import authorize from '../middleware/roleMiddleware';

const router = express.Router();

router.use(protect);
router.use(authorize('Retail Shop'));

router.get('/dashboard', getDashboardStats);
router.get('/products', getProducts);
router.post('/products', addProduct);
router.get('/customers', getShopCustomers);
router.post('/customers', addShopCustomer);
// Alias for inventory endpoint
router.get('/inventory', getProducts);

export default router;
