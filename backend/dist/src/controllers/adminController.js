"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleUserStatus = exports.getAdminUsers = exports.getAdminStats = void 0;
const db_1 = __importDefault(require("../config/db"));
// @desc    Get platform stats for admin
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getAdminStats = async (req, res, next) => {
    try {
        const [usersCount] = await db_1.default.execute('SELECT COUNT(*) as total_users FROM users');
        const [shopsCount] = await db_1.default.execute('SELECT COUNT(*) as total_shops FROM shops');
        const [deliveriesCount] = await db_1.default.execute('SELECT COUNT(*) as total_deliveries FROM delivery_business');
        const [billsStats] = await db_1.default.execute('SELECT COUNT(*) as total_bills, SUM(total_amount) as total_volume FROM bills');
        res.status(200).json({
            success: true,
            data: {
                total_users: usersCount[0].total_users,
                total_shops: shopsCount[0].total_shops,
                total_deliveries: deliveriesCount[0].total_deliveries,
                total_bills: billsStats[0].total_bills || 0,
                total_volume: billsStats[0].total_volume || 0
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminStats = getAdminStats;
// @desc    Get all users list
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAdminUsers = async (req, res, next) => {
    try {
        const [users] = await db_1.default.execute(`
            SELECT u.id, u.name, u.email, u.phone, r.name as "roleName", u.is_active, u.created_at
            FROM users u
            JOIN roles r ON u.role_id = r.id
            ORDER BY u.created_at DESC
        `);
        res.status(200).json({
            success: true,
            data: users
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminUsers = getAdminUsers;
// @desc    Toggle user active/inactive status
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin)
const toggleUserStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        await db_1.default.execute('UPDATE users SET is_active = NOT is_active WHERE id = ?', [id]);
        res.status(200).json({ success: true, message: 'User status updated successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.toggleUserStatus = toggleUserStatus;
