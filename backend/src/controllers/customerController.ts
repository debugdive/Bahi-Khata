import { Response, NextFunction } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Get Customer Dashboard Data
// @route   GET /api/customer/dashboard
// @access  Private (Customer)
export const getCustomerDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const customerUserId = req.user.id;

        // 1. Get Outstanding Amount across all businesses
        const [outstanding] = await pool.execute(
            `SELECT COALESCE(SUM(outstanding_balance), 0) as total_outstanding 
             FROM customers WHERE customer_user_id = ?`,
            [customerUserId]
        );

        // 2. Get Connected Businesses
        const [businesses] = await pool.execute(
            `SELECT c.id as customer_id, c.outstanding_balance, c.business_user_id,
                    u.name as business_name, u.phone, u.profile_pic, r.name as business_type
             FROM customers c
             JOIN users u ON c.business_user_id = u.id
             JOIN roles r ON u.role_id = r.id
             WHERE c.customer_user_id = ?`,
            [customerUserId]
        );

        res.status(200).json({
            success: true,
            data: {
                totalOutstanding: outstanding[0].total_outstanding,
                businesses
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get bills for a specific business for a customer
// @route   GET /api/customer/bills/:businessId
// @access  Private (Customer)
export const getCustomerBills = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { businessId } = req.params;
        const customerUserId = req.user.id;

        // Find customer mapping ID
        const [customerMap] = await pool.execute(
            `SELECT id FROM customers WHERE customer_user_id = ? AND business_user_id = ?`,
            [customerUserId, businessId]
        );

        if (customerMap.length === 0) {
            return res.status(404).json({ success: false, message: 'Not connected to this business' });
        }
        
        const customerId = customerMap[0].id;

        const [bills] = await pool.execute(
            `SELECT * FROM bills WHERE customer_id = ? AND business_user_id = ? ORDER BY created_at DESC`,
            [customerId, businessId]
        );

        res.status(200).json({ success: true, data: bills });
    } catch (error) {
        next(error);
    }
};

// @desc    Get subscriptions (services/delivery) for customer
// @route   GET /api/customer/subscriptions
// @access  Private (Customer)
export const getCustomerSubscriptions = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const customerUserId = req.user.id;
        
        const [subscriptions] = await pool.execute(
            `SELECT s.*, p.name as product_name, u.name as business_name,
                    (SELECT status FROM attendance WHERE subscription_id = s.id AND attendance_date = CURRENT_DATE LIMIT 1) as today_status
             FROM subscriptions s
             JOIN customers c ON s.customer_id = c.id
             JOIN users u ON s.business_user_id = u.id
             LEFT JOIN products p ON s.product_id = p.id
             WHERE c.customer_user_id = ?`,
            [customerUserId]
        );

        res.status(200).json({ success: true, data: subscriptions });
    } catch (error) {
        next(error);
    }
};

// @desc    Get payment history for customer
// @route   GET /api/customer/payments
// @access  Private (Customer)
export const getCustomerPayments = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const customerUserId = req.user.id;

        const [payments] = await pool.execute(
            `SELECT p.id, p.amount, p.payment_method, p.status, p.created_at, p.bill_id,
                    u.name as business_name, u.phone as business_phone
             FROM payments p
             JOIN customers c ON p.customer_id = c.id
             JOIN users u ON p.business_user_id = u.id
             WHERE c.customer_user_id = ?
             ORDER BY p.created_at DESC`,
            [customerUserId]
        );

        res.status(200).json({ success: true, data: payments });
    } catch (error) {
        next(error);
    }
};

// @desc    Pay all outstanding balance for customer across businesses
// @route   POST /api/customer/pay-all
// @access  Private (Customer)
export const payAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const customerUserId = req.user.id;

        // Get customer mappings with positive outstanding balance
        const [customerMappings] = await connection.execute(
            `SELECT id, business_user_id, outstanding_balance FROM customers WHERE customer_user_id = ? AND outstanding_balance > 0`,
            [customerUserId]
        );

        for (let map of customerMappings) {
            // Log payment
            await connection.execute(
                `INSERT INTO payments (business_user_id, customer_id, amount, payment_method, status) VALUES (?, ?, ?, 'UPI', 'Completed')`,
                [map.business_user_id, map.id, map.outstanding_balance]
            );

            // Update pending bills status to Paid
            await connection.execute(
                `UPDATE bills SET payment_status = 'Paid' WHERE customer_id = ? AND payment_status = 'Pending'`,
                [map.id]
            );

            // Clear outstanding balance
            await connection.execute(
                `UPDATE customers SET outstanding_balance = 0.00 WHERE id = ?`,
                [map.id]
            );
        }

        await connection.commit();
        res.status(200).json({ success: true, message: 'All outstanding bills paid successfully!' });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// @desc    Pause customer subscription
// @route   POST /api/customer/subscriptions/:id/pause
// @access  Private (Customer)
export const pauseSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { paused_until } = req.body;

        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const pauseDate = paused_until || nextWeek.toISOString().split('T')[0];

        await pool.execute(
            `UPDATE subscriptions SET status = 'Paused', paused_until = ? WHERE id = ?`,
            [pauseDate, id]
        );

        res.status(200).json({ success: true, message: 'Subscription paused successfully until ' + pauseDate });
    } catch (error) {
        next(error);
    }
};

// @desc    Request extra quantity for subscription
// @route   POST /api/customer/subscriptions/:id/extra
// @access  Private (Customer)
export const requestExtra = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { extra_quantity } = req.body;

        await pool.execute(
            `INSERT INTO delivery_requests (subscription_id, request_type, request_date, quantity, status) 
             VALUES (?, 'Extra', CURRENT_DATE, ?, 'Approved')`,
            [id, extra_quantity || 1]
        );

        // Update quantity for today's delivery in subscription
        await pool.execute(
            `UPDATE subscriptions SET quantity_per_delivery = quantity_per_delivery + ? WHERE id = ?`,
            [extra_quantity || 1, id]
        );

        res.status(200).json({ success: true, message: 'Extra item quantity requested successfully!' });
    } catch (error) {
        next(error);
    }
};
