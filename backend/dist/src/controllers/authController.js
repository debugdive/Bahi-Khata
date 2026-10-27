"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.updateProfile = exports.loginUser = exports.registerUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const generateToken = (id, roleName) => {
    return jsonwebtoken_1.default.sign({ id, roleName }, process.env.JWT_SECRET, {
        expiresIn: (process.env.JWT_EXPIRES_IN || '1d'),
    });
};
// @desc    Register a new user (with Temp Bill Auto-Linking)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
    try {
        const { name, email, phone, password, roleName, businessName } = req.body;
        if (!name || !phone || !password || !roleName) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }
        // Check if user exists
        const [existingUsers] = await db_1.default.execute('SELECT * FROM users WHERE phone = ? OR email = ?', [phone, email || null]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ success: false, message: 'User already exists with this phone or email' });
        }
        // Get Role ID
        const [roles] = await db_1.default.execute('SELECT id, name FROM roles WHERE name = ?', [roleName]);
        if (roles.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid role specified' });
        }
        const roleId = roles[0].id;
        // Hash password
        const salt = await bcrypt_1.default.genSalt(10);
        const hashedPassword = await bcrypt_1.default.hash(password, salt);
        // Insert User using password_hash column
        const [userResult] = await db_1.default.execute('INSERT INTO users (role_id, name, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)', [roleId, name, email || null, phone, hashedPassword]);
        const userId = userResult.insertId || userResult.id;
        // Handle Business specific tables
        if (roleName === 'Retail Shop') {
            await db_1.default.execute('INSERT INTO shops (user_id, business_name) VALUES (?, ?)', [userId, businessName || name]);
        }
        else if (roleName === 'Delivery Business') {
            await db_1.default.execute('INSERT INTO delivery_business (user_id, business_name) VALUES (?, ?)', [userId, businessName || name]);
        }
        else if (roleName === 'Service Provider') {
            await db_1.default.execute('INSERT INTO service_business (user_id, business_name) VALUES (?, ?)', [userId, businessName || name]);
        }
        // Auto-link any staged bills in temp_bills for this newly registered phone number
        if (roleName === 'Customer') {
            try {
                const [tempBills] = await db_1.default.execute('SELECT * FROM temp_bills WHERE phone = ?', [phone]);
                for (let temp of tempBills) {
                    const [mapping] = await db_1.default.execute('SELECT id FROM customers WHERE business_user_id = ? AND customer_user_id = ?', [temp.business_user_id, userId]);
                    let customerId;
                    if (mapping.length > 0) {
                        customerId = mapping[0].id;
                    }
                    else {
                        const [newMapping] = await db_1.default.execute('INSERT INTO customers (business_user_id, customer_user_id, customer_name, customer_phone, customer_email, outstanding_balance) VALUES (?, ?, ?, ?, ?, 0.00)', [temp.business_user_id, userId, name, phone, email || null]);
                        customerId = newMapping.insertId || newMapping.id;
                    }
                    const [billRes] = await db_1.default.execute(`INSERT INTO bills (business_user_id, customer_id, invoice_no, total_amount, discount_amount, net_amount, payment_status, payment_method)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [temp.business_user_id, customerId, temp.invoice_no, temp.total_amount, temp.discount_amount, temp.net_amount, temp.payment_status, temp.payment_method]);
                    const billId = billRes.insertId || billRes.id;
                    let items = [];
                    try {
                        items = typeof temp.items_json === 'string' ? JSON.parse(temp.items_json) : temp.items_json;
                    }
                    catch (e) { }
                    for (let item of items) {
                        await db_1.default.execute(`INSERT INTO bill_items (bill_id, product_id, product_name, quantity, price, total)
                             VALUES (?, ?, ?, ?, ?, ?)`, [billId, item.product_id || null, item.product_name, item.quantity, item.price, item.price * item.quantity]);
                    }
                    if (temp.payment_method === 'Udhar') {
                        await db_1.default.execute(`UPDATE customers SET outstanding_balance = outstanding_balance + ? WHERE id = ?`, [temp.net_amount, customerId]);
                    }
                    await db_1.default.execute('DELETE FROM temp_bills WHERE id = ?', [temp.id]);
                }
            }
            catch (linkErr) {
                console.error("Error auto-linking temp bills during registration:", linkErr);
            }
        }
        const token = generateToken(userId, roleName);
        res.status(201).json({
            success: true,
            data: { id: userId, name, email, phone, role: roleName },
            token
        });
    }
    catch (error) {
        next(error);
    }
};
exports.registerUser = registerUser;
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
    try {
        const { phone, password } = req.body;
        if (!phone || !password) {
            return res.status(400).json({ success: false, message: 'Please provide phone and password' });
        }
        const [users] = await db_1.default.execute('SELECT u.*, r.name as "roleName" FROM users u JOIN roles r ON u.role_id = r.id WHERE u.phone = ?', [phone]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const user = users[0];
        const isMatch = await bcrypt_1.default.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        if (!user.is_active) {
            return res.status(403).json({ success: false, message: 'Your account is inactive. Please contact support.' });
        }
        const token = generateToken(user.id, user.roleName);
        res.status(200).json({
            success: true,
            data: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.roleName, profile_pic: user.profile_pic },
            token
        });
    }
    catch (error) {
        next(error);
    }
};
exports.loginUser = loginUser;
// @desc    Update current user profile (name, email, phone)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
    try {
        const { name, email, phone } = req.body;
        const userId = req.user.id;
        if (!name && !email && !phone) {
            return res.status(400).json({ success: false, message: 'Please provide at least one field to update' });
        }
        if (phone || email) {
            const [existing] = await db_1.default.execute('SELECT id FROM users WHERE (phone = ? OR email = ?) AND id != ?', [phone || '', email || '', userId]);
            if (existing.length > 0) {
                return res.status(400).json({ success: false, message: 'Phone or email already in use by another account' });
            }
        }
        const fields = [];
        const values = [];
        if (name) {
            fields.push('name = ?');
            values.push(name);
        }
        if (email) {
            fields.push('email = ?');
            values.push(email);
        }
        if (phone) {
            fields.push('phone = ?');
            values.push(phone);
        }
        values.push(userId);
        await db_1.default.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
        const [updated] = await db_1.default.execute('SELECT u.id, u.name, u.email, u.phone, u.profile_pic, r.name as "roleName" FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?', [userId]);
        res.status(200).json({ success: true, data: updated[0] });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
    try {
        const [users] = await db_1.default.execute('SELECT u.id, u.name, u.email, u.phone, u.profile_pic, r.name as "roleName" FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?', [req.user.id]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({
            success: true,
            data: users[0]
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;
