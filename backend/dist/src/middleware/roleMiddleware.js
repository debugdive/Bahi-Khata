"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.roleName)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user ? req.user.roleName : 'undefined'} is not authorized to access this route`
            });
        }
        next();
    };
};
exports.authorize = authorize;
exports.default = exports.authorize;
