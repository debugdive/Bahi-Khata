import { Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/db';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Get Shop Dashboard Stats
// @route   GET /api/shop/dashboard
// @access  Private (Retail Shop)
export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const businessUserId = req.user.id;

        // Today's Revenue
        const [todayBills] = await pool.execute(
            `SELECT COALESCE(SUM(net_amount), 0) as revenue FROM bills 
             WHERE business_user_id = ? AND DATE(created_at) = CURRENT_DATE`,
            [businessUserId]
        );

        // Pending Udhar
        const [pendingUdhar] = await pool.execute(
            `SELECT COALESCE(SUM(outstanding_balance), 0) as total_udhar FROM customers 
             WHERE business_user_id = ?`,
            [businessUserId]
        );

        // Low Stock Products
        const [lowStock] = await pool.execute(
            `SELECT COUNT(*) as count FROM inventory 
             JOIN products ON inventory.product_id = products.id
             WHERE products.business_user_id = ? AND inventory.stock <= inventory.low_stock_threshold`,
            [businessUserId]
        );

        res.status(200).json({
            success: true,
            data: {
                todaysRevenue: todayBills[0].revenue,
                pendingUdhar: pendingUdhar[0].total_udhar,
                lowStockCount: lowStock[0].count
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all products for shop
// @route   GET /api/shop/products
// @access  Private
export const getProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const [products] = await pool.execute(
            `SELECT p.*, i.stock, i.low_stock_threshold, c.name as category_name 
             FROM products p 
             LEFT JOIN inventory i ON p.id = i.product_id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.business_user_id = ?`,
            [req.user.id]
        );
        res.status(200).json({ success: true, data: products });
    } catch (error) {
        next(error);
    }
};

// @desc    Add new product
// @route   POST /api/shop/products
// @access  Private
export const addProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { name, category_id, price, barcode, stock, low_stock_threshold } = req.body;

        const [productResult] = await connection.execute(
            'INSERT INTO products (business_user_id, category_id, name, price, barcode) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, category_id || null, name, price, barcode || null]
        );
        const productId = productResult.insertId || productResult.id;

        await connection.execute(
            'INSERT INTO inventory (product_id, business_user_id, stock, low_stock_threshold) VALUES (?, ?, ?, ?)',
            [productId, req.user.id, stock || 0, low_stock_threshold || 5]
        );

        await connection.commit();
        res.status(201).json({ success: true, message: 'Product added successfully' });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// @desc    Get shop customers
// @route   GET /api/shop/customers
// @access  Private
export const getShopCustomers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const [customers] = await pool.execute(
            `SELECT c.id as id, c.id as customer_id, c.customer_user_id, c.outstanding_balance, 
                    u.id as user_id, COALESCE(c.customer_name, u.name) as name, COALESCE(c.customer_phone, u.phone) as phone, COALESCE(c.customer_email, u.email) as email 
             FROM customers c 
             LEFT JOIN users u ON c.customer_user_id = u.id 
             WHERE c.business_user_id = ?
             ORDER BY c.created_at ASC`,
            [req.user.id]
        );
        res.status(200).json({ success: true, data: customers });
    } catch (error) {
        next(error);
    }
};

// @desc    Add / Link new customer for shop
// @route   POST /api/shop/customers
// @access  Private
export const addShopCustomer = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { name, phone, email } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ success: false, message: 'Name and Phone are required' });
        }

        const businessUserId = req.user.id;
        let customerUserId;

        // Check if user exists by phone
        const [existingUsers] = await connection.execute('SELECT id FROM users WHERE phone = ?', [phone]);

        if (existingUsers.length > 0) {
            customerUserId = existingUsers[0].id;
        } else {
            // Get Customer Role ID
            const [roles] = await connection.execute('SELECT id FROM roles WHERE name = ?', ['Customer']);
            const roleId = roles.length > 0 ? roles[0].id : null;

            // Default hashed password for auto-created customer
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);

            const [newUser] = await connection.execute(
                'INSERT INTO users (role_id, name, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)',
                [roleId, name, email || null, phone, hashedPassword]
            );
            customerUserId = newUser.insertId || newUser.id;
        }

        // Check if already mapped
        const [existingMapping] = await connection.execute(
            'SELECT id FROM customers WHERE business_user_id = ? AND customer_user_id = ?',
            [businessUserId, customerUserId]
        );

        let customerId;
        if (existingMapping.length > 0) {
            customerId = existingMapping[0].id;
        } else {
            const [newCustomer] = await connection.execute(
                'INSERT INTO customers (business_user_id, customer_user_id, customer_name, customer_phone, customer_email, outstanding_balance) VALUES (?, ?, ?, ?, ?, 0.00)',
                [businessUserId, customerUserId, name, phone, email || null]
            );
            customerId = newCustomer.insertId || newCustomer.id;
        }

        await connection.commit();
        res.status(201).json({
            success: true,
            message: 'Customer added successfully',
            data: { id: customerId, customer_id: customerId, customer_user_id: customerUserId, name, phone, email, outstanding_balance: 0 }
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};
