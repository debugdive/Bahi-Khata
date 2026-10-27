import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | undefined;

export const initSocket = (server: HttpServer): SocketIOServer => {
    io = new SocketIOServer(server, {
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

export const getIo = (): SocketIOServer => {
    if (!io) {
        throw new Error('Socket.io is not initialized');
    }
    return io;
};

export default initSocket;
