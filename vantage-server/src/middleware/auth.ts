import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import mongoose from 'mongoose';

export interface AuthRequest extends Request {
  user?: {
    _id: mongoose.Types.ObjectId;
    email: string;
    name: string;
    avatar?: string;
  };
}

const TOKEN_NAME = 'vantage_token';

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.[TOKEN_NAME];
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = {
      _id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};