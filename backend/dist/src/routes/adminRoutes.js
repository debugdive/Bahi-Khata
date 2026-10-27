"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../controllers/adminController");
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const roleMiddleware_1 = __importDefault(require("../middleware/roleMiddleware"));
const router = express_1.default.Router();
router.use(authMiddleware_1.default);
router.use((0, roleMiddleware_1.default)('Admin'));
router.get('/stats', adminController_1.getAdminStats);
router.get('/users', adminController_1.getAdminUsers);
router.patch('/users/:id/status', adminController_1.toggleUserStatus);
exports.default = router;
