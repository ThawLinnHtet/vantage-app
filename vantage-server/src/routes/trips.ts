import { Router, Response } from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import { Trip } from '../models/Trip.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { io } from '../index.js';

const router = Router();

router.use(authenticate);

async function geocodeDestination(destinationName: string): Promise<{ lat: number; lng: number }> {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: destinationName,
        format: 'json',
        limit: 1,
        addressdetails: 0
      },
      headers: {
        'User-Agent': 'Vantage Travel App (https://vantage.app)'
      }
    });
    
    if (response.data && response.data.length > 0) {
      return {
        lat: parseFloat(response.data[0].lat),
        lng: parseFloat(response.data[0].lon)
      };
    }
  } catch (err) {
    console.error('Geocoding failed:', err);
  }
  return { lat: 0, lng: 0 };
}

router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description, destination, startDate, endDate, budget } = req.body;

  if (!name || !destination?.name || !startDate || !endDate || !budget?.total) {
    const error = new Error('Missing required fields');
    (error as any).statusCode = 400;
    throw error;
  }

  let coords = { lat: 0, lng: 0 };
  if (destination.lat === 0 && destination.lng === 0 && destination.name) {
    coords = await geocodeDestination(destination.name);
  } else if (destination.lat && destination.lng) {
    coords = { lat: destination.lat, lng: destination.lng };
  }

  const trip = new Trip({
    name,
    description,
    destination: {
      name: destination.name,
      lat: coords.lat,
      lng: coords.lng
    },
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    budget: {
      total: budget.total,
      currency: budget.currency || 'USD',
      spent: 0
    },
    createdBy: req.user!._id,
    members: [{
      user: req.user!._id,
      role: 'admin',
      joinedAt: new Date()
    }],
    pois: []
  });

  await trip.save();
  res.status(201).json(trip);
}));

router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const trips = await Trip.find({ 'members.user': req.user!._id })
    .populate('members.user', 'name email avatar')
    .populate('createdBy', 'name email')
    .sort({ updatedAt: -1 });
  res.json(trips);
}));

router.get('/by-code/:code', asyncHandler(async (req: AuthRequest, res: Response) => {
  const trip = await Trip.findOne({ inviteCode: req.params.code.toUpperCase() })
    .populate('members.user', 'name email avatar')
    .populate('createdBy', 'name email');

  if (!trip) {
    const error = new Error('Trip not found');
    (error as any).statusCode = 404;
    throw error;
  }

  res.json(trip);
}));

router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const trip = await Trip.findById(req.params.id)
    .populate('members.user', 'name email avatar')
    .populate('createdBy', 'name email')
    .populate('pois.addedBy', 'name email');

  if (!trip) {
    const error = new Error('Trip not found');
    (error as any).statusCode = 404;
    throw error;
  }

  const isMember = trip.members.some(m => m.user._id.equals(req.user!._id));
  if (!isMember) {
    const error = new Error('Access denied');
    (error as any).statusCode = 403;
    throw error;
  }

  res.json(trip);
}));

router.put('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description, destination, startDate, endDate, budget } = req.body;

  const trip = await Trip.findById(req.params.id);
  if (!trip) {
    const error = new Error('Trip not found');
    (error as any).statusCode = 404;
    throw error;
  }

  const isAdmin = trip.members.some(m => 
    m.user.equals(req.user!._id) && m.role === 'admin'
  );
  if (!isAdmin) {
    const error = new Error('Only admin can update trip');
    (error as any).statusCode = 403;
    throw error;
  }

  if (name) trip.name = name;
  if (description !== undefined) trip.description = description;
  if (destination) {
    let coords = { lat: trip.destination.lat, lng: trip.destination.lng };
    
    const destNameChanged = destination.name && destination.name !== trip.destination.name;
    const coordsAreZero = (destination.lat === 0 && destination.lng === 0) || !destination.lat;
    
    if (destNameChanged && coordsAreZero) {
      coords = await geocodeDestination(destination.name);
    } else if (destination.lat && destination.lng) {
      coords = { lat: destination.lat, lng: destination.lng };
    }
    
    trip.destination = {
      name: destination.name || trip.destination.name,
      lat: coords.lat,
      lng: coords.lng
    };
  }
  if (startDate) trip.startDate = new Date(startDate);
  if (endDate) trip.endDate = new Date(endDate);
  if (budget) {
    trip.budget = {
      total: budget.total ?? trip.budget.total,
      currency: budget.currency ?? trip.budget.currency,
      spent: trip.budget.spent
    };
  }

  await trip.save();
  res.json(trip);
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) {
    const error = new Error('Trip not found');
    (error as any).statusCode = 404;
    throw error;
  }

  const isOwner = trip.createdBy.equals(req.user!._id);
  if (!isOwner) {
    const error = new Error('Only the owner can delete this trip');
    (error as any).statusCode = 403;
    throw error;
  }

  await trip.deleteOne();
  res.json({ message: 'Trip deleted' });
}));

router.post('/:id/join', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { code } = req.body;

  const trip = await Trip.findOne({ inviteCode: code?.toUpperCase() });
  if (!trip) {
    const error = new Error('Invalid invite code');
    (error as any).statusCode = 404;
    throw error;
  }

  const isAlreadyMember = trip.members.some(m => m.user.equals(req.user!._id));
  if (isAlreadyMember) {
    const error = new Error('Already a member');
    (error as any).statusCode = 400;
    throw error;
  }

  trip.members.push({
    user: req.user!._id,
    role: 'member',
    joinedAt: new Date()
  });

  await trip.save();
  
  const populatedTrip = await Trip.findById(trip._id)
    .populate('members.user', 'name email avatar')
    .populate('createdBy', 'name email');

  if (populatedTrip) {
    // Emit member:joined event to all users in the trip room
    const newMember = populatedTrip.members.find(
      (m: any) => m.user && m.user._id.toString() === req.user!._id.toString()
    );
    io.to(`trip:${trip._id}`).emit('member:joined', {
      member: newMember,
      count: populatedTrip.members.length
    });
  }

  res.json(populatedTrip);
}));

router.post('/:id/pois', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description, lat, lng, category, cost, currency } = req.body;

  if (!name || lat == null || lng == null) {
    const error = new Error('Name, lat, and lng are required');
    (error as any).statusCode = 400;
    throw error;
  }

  const trip = await Trip.findById(req.params.id);
  if (!trip) {
    const error = new Error('Trip not found');
    (error as any).statusCode = 404;
    throw error;
  }

  const isMember = trip.members.some(m => m.user.equals(req.user!._id));
  if (!isMember) {
    const error = new Error('Must be a member to add POIs');
    (error as any).statusCode = 403;
    throw error;
  }

  const poi = {
    _id: new mongoose.Types.ObjectId(),
    name,
    description,
    lat,
    lng,
    category: category || 'other',
    cost: cost || 0,
    currency: currency || trip.budget.currency,
    addedBy: req.user!._id,
    status: 'suggestion' as const,
    votes: [],
    createdAt: new Date()
  };
  
  console.log('[DEBUG] POI Creation - User ID:', req.user!._id.toString(), 'POI Name:', name);

  trip.pois.push(poi);
  await trip.save();

  const newPoi = trip.pois[trip.pois.length - 1];
  res.status(201).json(newPoi);
}));

router.put('/:id/pois/:poiId', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description, lat, lng, category, cost, currency } = req.body;

  const trip = await Trip.findById(req.params.id);
  if (!trip) {
    const error = new Error('Trip not found');
    (error as any).statusCode = 404;
    throw error;
  }

  const poiIndex = trip.pois.findIndex(p => p._id.equals(req.params.poiId));
  if (poiIndex === -1) {
    const error = new Error('POI not found');
    (error as any).statusCode = 404;
    throw error;
  }

  const poi = trip.pois[poiIndex];
  const isMember = trip.members.some(m => m.user.equals(req.user!._id));
  const isOwner = poi.addedBy.equals(req.user!._id);
  
  if (!isMember || (!isOwner && poi.status === 'confirmed')) {
    const error = new Error('Cannot edit this POI');
    (error as any).statusCode = 403;
    throw error;
  }

  if (name) poi.name = name;
  if (description !== undefined) poi.description = description;
  if (lat != null) poi.lat = lat;
  if (lng != null) poi.lng = lng;
  if (category) poi.category = category;
  if (cost != null) poi.cost = cost;
  if (currency) poi.currency = currency;

  await trip.save();
  res.json(poi);
}));

router.delete('/:id/pois/:poiId', asyncHandler(async (req: AuthRequest, res: Response) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) {
    const error = new Error('Trip not found');
    (error as any).statusCode = 404;
    throw error;
  }

  const poiIndex = trip.pois.findIndex(p => p._id.equals(req.params.poiId));
  if (poiIndex === -1) {
    const error = new Error('POI not found');
    (error as any).statusCode = 404;
    throw error;
  }

  const poi = trip.pois[poiIndex];
  const isAdmin = trip.members.some(m => 
    m.user.equals(req.user!._id) && m.role === 'admin'
  );
  const isOwner = poi.addedBy.equals(req.user!._id);

  if (!isAdmin && !isOwner) {
    const error = new Error('Cannot delete this POI');
    (error as any).statusCode = 403;
    throw error;
  }

  trip.pois.splice(poiIndex, 1);
  await trip.save();
  res.json({ message: 'POI deleted' });
}));

router.post('/:id/pois/:poiId/vote', asyncHandler(async (req: AuthRequest, res: Response) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) {
    const error = new Error('Trip not found');
    (error as any).statusCode = 404;
    throw error;
  }

  const isMember = trip.members.some(m => m.user.equals(req.user!._id));
  if (!isMember) {
    const error = new Error('Must be a member to vote');
    (error as any).statusCode = 403;
    throw error;
  }

  const poiIndex = trip.pois.findIndex(p => p._id.equals(req.params.poiId));
  if (poiIndex === -1) {
    const error = new Error('POI not found');
    (error as any).statusCode = 404;
    throw error;
  }

const poi = trip.pois[poiIndex];
  
  const hasVoted = poi.votes.some(v => v.equals(req.user!._id));
  if (hasVoted) {
    poi.votes = poi.votes.filter(v => !v.equals(req.user!._id));
  } else {
    poi.votes.push(req.user!._id);
  }

  // Auto-promote threshold: 60% of trip members
  const memberCount = trip.members.length;
  const thresholdVotes = Math.ceil(memberCount * 0.6); // 60%
  
  if (poi.status === 'suggestion' && poi.votes.length >= thresholdVotes) {
    poi.status = 'confirmed';
    trip.budget.spent = trip.calculateSpent();
    console.log('[PROMOTE HTTP] POI auto-promoted at', poi.votes.length, 'votes (threshold:', thresholdVotes, ')');
  }

  await trip.save();
  res.json(poi);
}));

router.post('/:id/pois/:poiId/confirm', asyncHandler(async (req: AuthRequest, res: Response) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) {
    const error = new Error('Trip not found');
    (error as any).statusCode = 404;
    throw error;
  }

  const isAdmin = trip.members.some(m => 
    m.user.equals(req.user!._id) && m.role === 'admin'
  );
  if (!isAdmin) {
    const error = new Error('Only admin can confirm POIs');
    (error as any).statusCode = 403;
    throw error;
  }

  const poiIndex = trip.pois.findIndex(p => p._id.equals(req.params.poiId));
  if (poiIndex === -1) {
    const error = new Error('POI not found');
    (error as any).statusCode = 404;
    throw error;
  }

  const poi = trip.pois[poiIndex];
  poi.status = 'confirmed';
  
  trip.budget.spent = trip.calculateSpent();

  await trip.save();
  res.json(poi);
}));

export default router;