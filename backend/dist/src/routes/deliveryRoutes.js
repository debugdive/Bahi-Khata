"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const deliveryController_1 = require("../controllers/deliveryController");
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const roleMiddleware_1 = __importDefault(require("../middleware/roleMiddleware"));
const router = express_1.default.Router();
router.use(authMiddleware_1.default);
// Allow both Delivery Business and Service Provider
router.use((0, roleMiddleware_1.default)('Delivery Business', 'Service Provider'));
router.get('/todays-route', deliveryController_1.getTodaysRoute);
router.post('/attendance', deliveryController_1.markAttendance);
router.get('/customers', deliveryController_1.getDeliveryCustomers);
router.post('/customers', deliveryController_1.addDeliveryCustomer);
router.post('/calculate-bill', deliveryController_1.calculateAndGenerateBill);
exports.default = router;
