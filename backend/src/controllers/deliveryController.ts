import { Response, NextFunction } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Get Today's Delivery Route/List (Filtered by Today's Day of Week)
// @route   GET /api/delivery/todays-route
// @access  Private (Delivery/Service)
export const getTodaysRoute = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const businessUserId = req.user.id;
        const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        
        const [routeData] = await pool.execute(
            `SELECT s.id as subscription_id, s.quantity_per_delivery, s.service_name, p.name as product_name, p.price as unit_price,
                    c.id as customer_id, COALESCE(c.customer_name, u.name) as customer_name, COALESCE(c.customer_phone, u.phone) as customer_phone, 
                    a.address_line,
                    (SELECT status FROM attendance WHERE subscription_id = s.id AND attendance_date = CURRENT_DATE LIMIT 1) as today_status
             FROM subscriptions s
             JOIN customers c ON s.customer_id = c.id
             LEFT JOIN users u ON c.customer_user_id = u.id
             LEFT JOIN addresses a ON u.id = a.user_id AND a.type = 'Home'
             LEFT JOIN products p ON s.product_id = p.id
             WHERE s.business_user_id = ? 
               AND s.status = 'Active'`, 
            [businessUserId]
        );

        res.status(200).json({ success: true, data: routeData, today: todayName });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark Attendance (Delivered/Missed)
// @route   POST /api/delivery/attendance
// @access  Private
export const markAttendance = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { subscription_id, status, quantity_delivered, notes } = req.body;
        const businessUserId = req.user.id;

        // Fetch sub to get customer_id
        const [subs] = await pool.execute('SELECT customer_id FROM subscriptions WHERE id = ?', [subscription_id]);
        const customerId = subs.length > 0 ? subs[0].customer_id : null;
        
        await pool.execute(
            `INSERT INTO attendance (subscription_id, business_user_id, customer_id, attendance_date, status, quantity_delivered, notes) 
             VALUES (?, ?, ?, CURRENT_DATE, ?, ?, ?)
             ON CONFLICT (subscription_id, attendance_date) DO UPDATE SET status = EXCLUDED.status, quantity_delivered = EXCLUDED.quantity_delivered, notes = EXCLUDED.notes`,
            [subscription_id, businessUserId, customerId, status, quantity_delivered || 1, notes || null]
        );

        res.status(200).json({ success: true, message: 'Attendance updated successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all customers & subscriptions for delivery business
// @route   GET /api/delivery/customers
// @access  Private
export const getDeliveryCustomers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const [customers] = await pool.execute(
            `SELECT s.id as subscription_id, s.quantity_per_delivery, s.frequency, s.status as sub_status, s.service_name,
                    c.id as customer_id, c.outstanding_balance,
                    COALESCE(c.customer_name, u.name) as customer_name, 
                    COALESCE(c.customer_phone, u.phone) as customer_phone, 
                    COALESCE(c.customer_email, u.email) as customer_email,
                    p.id as product_id, p.name as product_name, p.price as unit_price
             FROM subscriptions s
             JOIN customers c ON s.customer_id = c.id
             LEFT JOIN users u ON c.customer_user_id = u.id 
             LEFT JOIN products p ON s.product_id = p.id
             WHERE s.business_user_id = ?
             ORDER BY s.created_at DESC`,
            [req.user.id]
        );
        res.status(200).json({ success: true, data: customers });
    } catch (error) {
        next(error);
    }
};

// @desc    Add customer & service subscription (Strict Registration Check)
// @route   POST /api/delivery/customers
// @access  Private
export const addDeliveryCustomer = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { phone, service_name, unit_price, quantity_per_delivery, frequency, delivery_days } = req.body;

        if (!phone || !service_name || !unit_price) {
            return res.status(400).json({ success: false, message: 'Phone, Service Name, and Unit Price are required' });
        }

        const businessUserId = req.user.id;
        const cleanPhone = phone.trim();

        // Strict Registration Check: Phone MUST exist in users table
        const [existingUsers] = await connection.execute('SELECT id, name, email FROM users WHERE phone = ?', [cleanPhone]);

        if (existingUsers.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: `Customer phone number (${cleanPhone}) is not registered on Bahi Khata. Customer must register on Bahi Khata first before adding a subscription.`
            });
        }

        const customerUserId = existingUsers[0].id;
        const customerName = existingUsers[0].name;

        // Check or create customer mapping
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
                [businessUserId, customerUserId, customerName, cleanPhone, existingUsers[0].email || null]
            );
            customerId = newCustomer.insertId || newCustomer.id;
        }

        // Check or create product/service
        const [existingProducts] = await connection.execute(
            'SELECT id FROM products WHERE business_user_id = ? AND name = ?',
            [businessUserId, service_name]
        );

        let productId;
        if (existingProducts.length > 0) {
            productId = existingProducts[0].id;
        } else {
            const [newProduct] = await connection.execute(
                'INSERT INTO products (business_user_id, name, price) VALUES (?, ?, ?)',
                [businessUserId, service_name, unit_price]
            );
            productId = newProduct.insertId || newProduct.id;
        }

        const selectedDays = delivery_days || 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday';

        // Create Subscription
        const [newSub] = await connection.execute(
            `INSERT INTO subscriptions (business_user_id, customer_id, product_id, service_name, start_date, frequency, status, quantity_per_delivery) 
             VALUES (?, ?, ?, ?, CURRENT_DATE, ?, 'Active', ?)`,
            [businessUserId, customerId, productId, service_name, frequency || 'Everyday', quantity_per_delivery || 1]
        );
        const subId = newSub.insertId || newSub.id;

        // Insert days into subscription_days
        const dayList = selectedDays.split(',').map((d: string) => d.trim().toLowerCase());
        for (let day of dayList) {
            if (['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].includes(day)) {
                await connection.execute(
                    'INSERT INTO subscription_days (subscription_id, day_of_week) VALUES (?, ?) ON CONFLICT DO NOTHING',
                    [subId, day]
                );
            }
        }

        await connection.commit();
        res.status(201).json({
            success: true,
            message: 'Service subscription created successfully',
            data: { subscription_id: subId, customer_id: customerId, name: customerName, phone: cleanPhone, service_name, unit_price, delivery_days: selectedDays }
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// @desc    Calculate and generate monthly/service bill for subscription
// @route   POST /api/delivery/calculate-bill
// @access  Private
export const calculateAndGenerateBill = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { subscription_id } = req.body;
        const businessUserId = req.user.id;

        // Fetch subscription details
        const [subs] = await connection.execute(
            `SELECT s.*, p.price as unit_price, p.name as product_name, c.id as customer_id, COALESCE(c.customer_name, u.name) as customer_name, COALESCE(c.customer_phone, u.phone) as customer_phone
             FROM subscriptions s
             JOIN customers c ON s.customer_id = c.id
             LEFT JOIN users u ON c.customer_user_id = u.id
             LEFT JOIN products p ON s.product_id = p.id
             WHERE s.id = ? AND s.business_user_id = ?`,
            [subscription_id, businessUserId]
        );

        if (subs.length === 0) {
            return res.status(404).json({ success: false, message: 'Subscription not found' });
        }

        const sub = subs[0];
        const unitPrice = parseFloat(sub.unit_price || 0);

        // Count total delivered quantity from attendance
        const [attendanceStats] = await connection.execute(
            `SELECT COUNT(*) as days_delivered, COALESCE(SUM(quantity_delivered), 0) as total_delivered_qty
             FROM attendance
             WHERE subscription_id = ? AND status = 'Delivered'`,
            [subscription_id]
        );

        const daysDelivered = parseInt(attendanceStats[0].days_delivered || 0);
        let totalDeliveredQty = parseFloat(attendanceStats[0].total_delivered_qty || 0);

        if (daysDelivered === 0) {
            totalDeliveredQty = parseFloat(sub.quantity_per_delivery || 1) * 30;
        }

        const calculatedAmount = totalDeliveredQty * unitPrice;
        const invoice_no = 'SUB-INV-' + Date.now();

        // Create Bill
        const [billResult] = await connection.execute(
            `INSERT INTO bills (business_user_id, customer_id, invoice_no, total_amount, discount_amount, net_amount, payment_status, payment_method) 
             VALUES (?, ?, ?, ?, 0.00, ?, 'Pending', 'Udhar')`,
            [businessUserId, sub.customer_id, invoice_no, calculatedAmount, calculatedAmount]
        );
        const billId = billResult.insertId || billResult.id;

        // Insert Bill Item
        await connection.execute(
            `INSERT INTO bill_items (bill_id, product_id, product_name, quantity, price, total) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [billId, sub.product_id, sub.product_name || sub.service_name, totalDeliveredQty, unitPrice, calculatedAmount]
        );

        // Update Customer Outstanding Udhar Balance
        await connection.execute(
            `UPDATE customers SET outstanding_balance = outstanding_balance + ? WHERE id = ?`,
            [calculatedAmount, sub.customer_id]
        );

        await connection.commit();
        res.status(201).json({
            success: true,
            message: 'Service bill calculated and issued successfully!',
            data: {
                bill_id: billId,
                invoice_no,
                customer_name: sub.customer_name,
                days_delivered: daysDelivered,
                total_qty: totalDeliveredQty,
                unit_price: unitPrice,
                calculated_amount: calculatedAmount
            }
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};
