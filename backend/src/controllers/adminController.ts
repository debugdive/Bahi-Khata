import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';

// @desc    Get platform stats for admin
// @route   GET /api/admin/stats
// @access  Private (Admin)
export const getAdminStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const [usersCount] = await pool.execute('SELECT COUNT(*) as total_users FROM users');
        const [shopsCount] = await pool.execute('SELECT COUNT(*) as total_shops FROM shops');
        const [deliveriesCount] = await pool.execute('SELECT COUNT(*) as total_deliveries FROM delivery_business');
        const [billsStats] = await pool.execute('SELECT COUNT(*) as total_bills, SUM(total_amount) as total_volume FROM bills');

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
    } catch (error) {
        next(error);
    }
};

// @desc    Get all users list
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getAdminUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const [users] = await pool.execute(`
            SELECT u.id, u.name, u.email, u.phone, r.name as "roleName", u.is_active, u.created_at
            FROM users u
            JOIN roles r ON u.role_id = r.id
            ORDER BY u.created_at DESC
        `);

        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Toggle user active/inactive status
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin)
export const toggleUserStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await pool.execute('UPDATE users SET is_active = NOT is_active WHERE id = ?', [id]);
        res.status(200).json({ success: true, message: 'User status updated successfully' });
    } catch (error) {
        next(error);
    }
};
