"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const billController_1 = require("../controllers/billController");
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const router = express_1.default.Router();
router.use(authMiddleware_1.default);
router.route('/')
    .get(billController_1.getBills)
    .post(billController_1.generateBill);
router.get('/:id/pdf', billController_1.downloadBillPDF);
exports.default = router;
