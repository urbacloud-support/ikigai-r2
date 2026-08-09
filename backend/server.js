import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

// Route Imports
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import evaluatorRoutes from './routes/evaluator.routes.js';
import judgeRoutes from './routes/judge.routes.js';
import studentRoutes from './routes/student.routes.js';
import mailingRoutes from './routes/mailing.routes.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }
});

// Middleware
app.use(cors());
app.use(express.json());

// Make Socket.io accessible in routes
app.set('io', io);

// WebSocket Setup
io.on('connection', (socket) => {
    socket.on('join-event', (eventId) => socket.join(`event:${eventId}`));
    socket.on('join-track', ({ eventId, trackId }) => socket.join(`track:${eventId}:${trackId}`));
});

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/evaluator', evaluatorRoutes);
app.use('/api/judge', judgeRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/mailing', mailingRoutes);

// Database Connection & Server Start
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to ikigai2 database');
        const PORT = process.env.PORT || 5000;
        httpServer.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Database connection failed:', err.message);
    });
