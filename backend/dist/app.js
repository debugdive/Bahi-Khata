"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./src/routes/authRoutes"));
const shopRoutes_1 = __importDefault(require("./src/routes/shopRoutes"));
const billRoutes_1 = __importDefault(require("./src/routes/billRoutes"));
const deliveryRoutes_1 = __importDefault(require("./src/routes/deliveryRoutes"));
const customerRoutes_1 = __importDefault(require("./src/routes/customerRoutes"));
const adminRoutes_1 = __importDefault(require("./src/routes/adminRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. curl, mobile apps)
        if (!origin)
            return callback(null, true);
        const allowed = [
            /^http:\/\/localhost:\d+$/,
            /^http:\/\/127\.0\.0\.1:\d+$/,
            /^https:\/\/.*\.netlify\.app$/,
        ];
        if (allowed.some((pattern) => pattern.test(origin))) {
            return callback(null, true);
        }
        return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);
// Serve uploads statically
app.use('/uploads', express_1.default.static('uploads'));
// Routes Placeholder
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Bahi Khata API is running' });
});
// Use Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/shop', shopRoutes_1.default);
app.use('/api/bills', billRoutes_1.default);
app.use('/api/delivery', deliveryRoutes_1.default);
app.use('/api/customer', customerRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});
exports.default = app;
