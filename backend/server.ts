import http from 'http';
import app from './app';
import initSocket from './src/socket/index';

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
