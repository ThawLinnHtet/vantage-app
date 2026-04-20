import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import tripRoutes from './routes/trips.js';
import geocodeRoutes from './routes/geocode.js';
import currencyRoutes from './routes/currency.js';
import { errorHandler } from './middleware/errorHandler.js';
import { Trip } from './models/Trip.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.use((socket, next) => {
  const userId = socket.handshake.auth.userId;
  
  if (!userId) {
    return next(new Error('Authentication required'));
  }
  
  socket.data.userId = userId;
  next();
});

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/currency', currencyRoutes);

app.use(errorHandler);

const tripParticipants: Map<string, Set<string>> = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-trip', (tripId: string) => {
    socket.join(`trip:${tripId}`);
    
    if (!tripParticipants.has(tripId)) {
      tripParticipants.set(tripId, new Set());
    }
    tripParticipants.get(tripId)!.add(socket.id);
    
    const count = tripParticipants.get(tripId)!.size;
    io.to(`trip:${tripId}`).emit('presence:count', count);
    console.log(`Socket ${socket.id} joined trip:${tripId} (${count} participants)`);
  });

  socket.on('leave-trip', (tripId: string) => {
    socket.leave(`trip:${tripId}`);
    
    if (tripParticipants.has(tripId)) {
      tripParticipants.get(tripId)!.delete(socket.id);
      const count = tripParticipants.get(tripId)!.size;
      io.to(`trip:${tripId}`).emit('presence:count', count);
    }
  });

  socket.on('poi:create', async (data: { tripId: string; poi: any }) => {
    try {
      const trip = await Trip.findById(data.tripId);
      if (!trip) return;

      const userId = new mongoose.Types.ObjectId(socket.data.userId);

      const newPoi: any = {
        _id: new mongoose.Types.ObjectId(),
        name: data.poi.name,
        description: data.poi.description,
        lat: data.poi.lat,
        lng: data.poi.lng,
        category: data.poi.category,
        cost: data.poi.cost,
        currency: data.poi.currency || trip.budget.currency || 'MMK',
        addedBy: userId,
        status: data.poi.status || 'suggestion',
        votes: [],
        createdAt: new Date()
      };

      console.log('[SOCKET] POI created by user:', socket.data.userId, 'POI:', data.poi.name);

      trip.pois.push(newPoi);
      await trip.save();

      const savedTrip = await Trip.findById(data.tripId);
      const savedPoi = savedTrip?.pois.find((p: any) => p._id.toString() === newPoi._id.toString());
      
      io.to(`trip:${data.tripId}`).emit('poi:added', savedPoi || newPoi);
    } catch (err) {
      console.error('Error creating POI:', err);
    }
  });

  socket.on('poi:update', async (data: { tripId: string; poiId: string; [key: string]: any }) => {
    try {
      const { tripId, poiId, ...updateData } = data;

      if (!mongoose.Types.ObjectId.isValid(poiId)) {
        console.error('Invalid poiId:', poiId);
        return;
      }

      const trip = await Trip.findById(tripId);
      if (!trip) return;

      const poiIndex = trip.pois.findIndex((p: any) => p._id.toString() === poiId);
      if (poiIndex === -1) return;

      Object.assign(trip.pois[poiIndex], updateData);
      await trip.save();

      const updatedPoi = trip.pois[poiIndex];
      io.to(`trip:${tripId}`).emit('poi:updated', updatedPoi);
    } catch (err) {
      console.error('Error updating POI:', err);
    }
  });

  socket.on('poi:delete', async (data: { tripId: string; poiId: string }) => {
    try {
      const trip = await Trip.findById(data.tripId);
      if (!trip) return;

      trip.pois = trip.pois.filter((p: any) => p._id.toString() !== data.poiId);
      await trip.save();

      io.to(`trip:${data.tripId}`).emit('poi:deleted', data.poiId);
    } catch (err) {
      console.error('Error deleting POI:', err);
    }
  });

  socket.on('poi:vote', async (data: { tripId: string; poiId: string; type: 'up' | 'down' }) => {
    try {
      const trip = await Trip.findById(data.tripId);
      if (!trip) return;

      const poi: any = trip.pois.find((p: any) => p._id.toString() === data.poiId);
      if (!poi) return;

      const voterId = socket.data.userId;
      const userObjId = new mongoose.Types.ObjectId(voterId);
      const hasVoted = poi.votes.some((v: any) => v.toString() === voterId);

      if (hasVoted) {
        poi.votes = poi.votes.filter((v: any) => v.toString() !== voterId);
      } else {
        poi.votes.push(userObjId);
      }
      
      console.log('[VOTE] User:', voterId, 'POI:', data.poiId, 'HasVoted:', hasVoted, 'NewCount:', poi.votes.length);

      // Auto-promote threshold: 60% of trip members
      const memberCount = trip.members.length;
      const thresholdVotes = Math.ceil(memberCount * 0.6); // 60%
      const wasConfirmed = poi.status === 'confirmed';
      
      if (!wasConfirmed && poi.votes.length >= thresholdVotes && poi.status === 'suggestion') {
        poi.status = 'confirmed';
        trip.budget.spent = trip.calculateSpent();
        console.log('[PROMOTE] POI auto-promoted at', poi.votes.length, 'votes (threshold:', thresholdVotes, ')');
      }

      await trip.save();
      io.to(`trip:${data.tripId}`).emit('poi:updated', poi);
      
      // Emit promotion event if auto-promoted
      if (poi.status === 'confirmed' && !wasConfirmed) {
        io.to(`trip:${data.tripId}`).emit('poi:promoted', poi);
      }
    } catch (err) {
      console.error('Error voting POI:', err);
    }
  });

  socket.on('disconnect', () => {
    tripParticipants.forEach((participants, tripId) => {
      if (participants.has(socket.id)) {
        participants.delete(socket.id);
        const count = participants.size;
        io.to(`trip:${tripId}`).emit('presence:count', count);
      }
    });
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();