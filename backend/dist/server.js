"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const index_1 = __importDefault(require("./src/socket/index"));
const PORT = process.env.PORT || 5000;
const server = http_1.default.createServer(app_1.default);
// Initialize Socket.io
(0, index_1.default)(server);
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
