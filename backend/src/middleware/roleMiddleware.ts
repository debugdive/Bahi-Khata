import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.roleName)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user ? req.user.roleName : 'undefined'} is not authorized to access this route`
            });
        }
        next();
    };
};

export default authorize;
