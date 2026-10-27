import { Response, NextFunction } from 'express';
import pool from '../config/db';
import PDFDocument from 'pdfkit';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Generate a new bill (POS)
// @route   POST /api/bills
// @access  Private (Retail Shop)
export const generateBill = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { customer_id, customer_phone, customer_name, items, payment_method, discount_amount } = req.body;
        
        const businessUserId = req.user.id;
        let total_amount = 0;
        
        for (let item of items) {
            total_amount += item.price * item.quantity;
        }
        
        const net_amount = Math.max(0, total_amount - (discount_amount || 0));
        const invoice_no = 'INV-' + Date.now();
        const payment_status = payment_method === 'Udhar' ? 'Pending' : 'Paid';

        // Check if customer phone is provided and whether it exists in users table
        if (customer_phone && customer_phone.trim() !== '') {
            const cleanPhone = customer_phone.trim();
            const [users] = await connection.execute('SELECT id, name, email FROM users WHERE phone = ?', [cleanPhone]);

            if (users.length === 0) {
                // UNREGISTERED PHONE NUMBER -> Save bill in temp_bills staging table
                await connection.execute(
                    `INSERT INTO temp_bills (business_user_id, phone, invoice_no, total_amount, discount_amount, net_amount, payment_status, payment_method, items_json)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        businessUserId, 
                        cleanPhone, 
                        invoice_no, 
                        total_amount, 
                        discount_amount || 0, 
                        net_amount, 
                        payment_status, 
                        payment_method, 
                        JSON.stringify(items)
                    ]
                );

                // Deduct inventory stock
                for (let item of items) {
                    if (item.product_id) {
                        await connection.execute(
                            `UPDATE inventory SET stock = stock - ? WHERE product_id = ?`,
                            [item.quantity, item.product_id]
                        );
                    }
                }

                await connection.commit();
                return res.status(201).json({
                    success: true,
                    message: `Bill ${invoice_no} saved to temporary staging for phone ${cleanPhone}. Will auto-link when customer registers!`,
                    data: { billId: null, invoice_no, temp: true, phone: cleanPhone }
                });
            }

            // REGISTERED USER -> Auto-find/create mapping in customers table
            const userObj = users[0];
            const customerUserId = userObj.id;
            const [mapping] = await connection.execute(
                'SELECT id FROM customers WHERE business_user_id = ? AND customer_user_id = ?',
                [businessUserId, customerUserId]
            );

            let resolvedCustomerId;
            if (mapping.length > 0) {
                resolvedCustomerId = mapping[0].id;
            } else {
                const [newMapping] = await connection.execute(
                    'INSERT INTO customers (business_user_id, customer_user_id, customer_name, customer_phone, customer_email, outstanding_balance) VALUES (?, ?, ?, ?, ?, 0.00)',
                    [businessUserId, customerUserId, customer_name || userObj.name, cleanPhone, userObj.email || null]
                );
                resolvedCustomerId = newMapping.insertId || newMapping.id;
            }

            // Insert Standard Bill
            const [billResult] = await connection.execute(
                `INSERT INTO bills (business_user_id, customer_id, invoice_no, total_amount, discount_amount, net_amount, payment_status, payment_method) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [businessUserId, resolvedCustomerId, invoice_no, total_amount, discount_amount || 0, net_amount, payment_status, payment_method]
            );
            const billId = billResult.insertId || billResult.id;

            // Insert Bill Items and Update Inventory
            for (let item of items) {
                const itemTotal = item.price * item.quantity;
                await connection.execute(
                    `INSERT INTO bill_items (bill_id, product_id, product_name, quantity, price, total) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [billId, item.product_id, item.product_name, item.quantity, item.price, itemTotal]
                );

                if (item.product_id) {
                    await connection.execute(
                        `UPDATE inventory SET stock = stock - ? WHERE product_id = ?`,
                        [item.quantity, item.product_id]
                    );
                }
            }

            // Handle Udhar Balance Update
            if (payment_method === 'Udhar') {
                await connection.execute(
                    `UPDATE customers SET outstanding_balance = outstanding_balance + ? WHERE id = ?`,
                    [net_amount, resolvedCustomerId]
                );
            } else {
                await connection.execute(
                    `INSERT INTO payments (business_user_id, customer_id, bill_id, amount, payment_method, status) 
                     VALUES (?, ?, ?, ?, ?, 'Completed')`,
                    [businessUserId, resolvedCustomerId, billId, net_amount, payment_method]
                );
            }

            await connection.commit();
            return res.status(201).json({ 
                success: true, 
                message: 'Bill generated successfully', 
                data: { billId, invoice_no, customer_id: resolvedCustomerId } 
            });
        }

        // WALK-IN BILL (No phone number)
        const [billResult] = await connection.execute(
            `INSERT INTO bills (business_user_id, customer_id, invoice_no, total_amount, discount_amount, net_amount, payment_status, payment_method) 
             VALUES (?, NULL, ?, ?, ?, ?, ?, ?)`,
            [businessUserId, invoice_no, total_amount, discount_amount || 0, net_amount, payment_status, payment_method]
        );
        const billId = billResult.insertId || billResult.id;

        for (let item of items) {
            const itemTotal = item.price * item.quantity;
            await connection.execute(
                `INSERT INTO bill_items (bill_id, product_id, product_name, quantity, price, total) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [billId, item.product_id, item.product_name, item.quantity, item.price, itemTotal]
            );

            if (item.product_id) {
                await connection.execute(
                    `UPDATE inventory SET stock = stock - ? WHERE product_id = ?`,
                    [item.quantity, item.product_id]
                );
            }
        }

        await connection.commit();
        res.status(201).json({ 
            success: true, 
            message: 'Walk-in Bill generated successfully', 
            data: { billId, invoice_no } 
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// @desc    Get all bills for a shop
// @route   GET /api/bills
// @access  Private (Retail Shop)
export const getBills = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const [bills] = await pool.execute(
            `SELECT b.*, COALESCE(c.customer_name, u.name) as customer_name, COALESCE(c.customer_phone, u.phone) as customer_phone 
             FROM bills b 
             LEFT JOIN customers c ON b.customer_id = c.id
             LEFT JOIN users u ON c.customer_user_id = u.id
             WHERE b.business_user_id = ? 
             ORDER BY b.created_at DESC`,
            [req.user.id]
        );
        res.status(200).json({ success: true, data: bills });
    } catch (error) {
        next(error);
    }
};

// @desc    Download Bill as PDF
// @route   GET /api/bills/:id/pdf
// @access  Private (Retail Shop / Customer)
export const downloadBillPDF = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const billId = req.params.id;
        const [bills] = await pool.execute(
            `SELECT b.*, COALESCE(c.customer_name, u.name) as customer_name, COALESCE(c.customer_phone, u.phone) as customer_phone, s.business_name
             FROM bills b 
             LEFT JOIN customers c ON b.customer_id = c.id
             LEFT JOIN users u ON c.customer_user_id = u.id
             LEFT JOIN shops s ON b.business_user_id = s.user_id
             WHERE b.id = ?`,
            [billId]
        );

        if (bills.length === 0) {
            return res.status(404).json({ success: false, message: 'Bill not found' });
        }

        const bill = bills[0];

        const [items] = await pool.execute(
            `SELECT * FROM bill_items WHERE bill_id = ?`,
            [billId]
        );

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice_${bill.invoice_no}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(22).fillColor('#1E40AF').text(bill.business_name || 'Bahi Khata Store', { align: 'center' });
        doc.fontSize(10).fillColor('#6B7280').text('TAX INVOICE & RECEIPT', { align: 'center' });
        doc.moveDown(1.5);

        // Invoice Metadata
        doc.fontSize(10).fillColor('#111827');
        doc.text(`Invoice No: ${bill.invoice_no}`);
        doc.text(`Date: ${new Date(bill.created_at).toLocaleString()}`);
        doc.text(`Customer Name: ${bill.customer_name || 'Walk-in Customer'}`);
        if (bill.customer_phone) doc.text(`Customer Phone: ${bill.customer_phone}`);
        doc.moveDown(1.5);

        // Table Header
        doc.fontSize(11).fillColor('#1F2937').text('Items Purchased:', { underline: true });
        doc.moveDown(0.5);

        // Items List
        items.forEach((item: any, index: number) => {
            doc.fontSize(10).fillColor('#374151')
               .text(`${index + 1}. ${item.product_name} — Qty: ${item.quantity} x ₹${parseFloat(item.price).toFixed(2)} = ₹${parseFloat(item.total).toFixed(2)}`);
        });

        doc.moveDown(1.5);

        // Summary
        doc.fontSize(10).fillColor('#4B5563');
        doc.text(`Subtotal: ₹${parseFloat(bill.total_amount).toFixed(2)}`);
        if (bill.discount_amount > 0) {
            doc.text(`Discount: -₹${parseFloat(bill.discount_amount).toFixed(2)}`);
        }
        doc.fontSize(14).fillColor('#1E40AF').text(`Net Total: ₹${parseFloat(bill.net_amount).toFixed(2)}`);
        doc.fontSize(10).fillColor('#111827').text(`Payment Method: ${bill.payment_method} (${bill.payment_status})`);

        doc.moveDown(2);
        doc.fontSize(10).fillColor('#9CA3AF').text('Thank you for shopping with us!', { align: 'center' });

        doc.end();
    } catch (error) {
        next(error);
    }
};
