import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { connectDB } from './config/db.js';
import { rehydrateTimer } from './utils/timerService.js';

// Route Imports
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import evaluatorRoutes from './routes/evaluator.routes.js';
import timerRoutes from './routes/timer.routes.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// CORS Config — dynamic whitelist
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://acrocsit.in',                        // R2 frontend
  'https://ikigai-csit.up.railway.app',         // R1 frontend
  'https://ikigai2-backend.up.railway.app'      // R2 backend
];

const dynamicOrigin = function (origin, callback) {
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin) || origin.endsWith('.up.railway.app') || origin.endsWith('.vercel.app')) {
    return callback(null, true);
  }
  callback(new Error('Not allowed by CORS'));
};

app.use(cors({
  origin: dynamicOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Timer-Key'],
  credentials: true
}));

app.use(express.json({ limit: '25mb' }));

// WebSocket setup
const io = new SocketServer(httpServer, {
  cors: {
    origin: dynamicOrigin,
    methods: ['GET', 'POST', 'PATCH'],
    credentials: true
  }
});
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on('join-event', (eventId) => socket.join(`event:${eventId}`));
  socket.on('join-evaluator', (userId) => socket.join(`evaluator:${userId}`));
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/evaluator', evaluatorRoutes);
app.use('/api/timer', timerRoutes);  // Public timer read (API-key protected)

// Health check
app.get('/', (req, res) => res.send('Ikigai2 Backend Native API is running'));

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  // Rehydrate timer from DB after DB connection is ready
  await rehydrateTimer();

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
});
