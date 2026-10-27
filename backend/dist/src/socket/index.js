"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIo = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let io;
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
        // Add custom socket event listeners here
        // e.g. for real-time notifications
    });
    return io;
};
exports.initSocket = initSocket;
const getIo = () => {
    if (!io) {
        throw new Error('Socket.io is not initialized');
    }
    return io;
};
exports.getIo = getIo;
exports.default = exports.initSocket;
