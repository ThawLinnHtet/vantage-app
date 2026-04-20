import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

const TOKEN_NAME = 'vantage_token';
const isProduction = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS: Parameters<typeof import('express').Response.cookie>[2] = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
};

const generateToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });
};

router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  console.log('Register request body:', req.body);
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    console.log('Missing fields - email:', !!email, 'password:', !!password, 'name:', !!name);
    const error = new Error('All fields are required');
    (error as any).statusCode = 400;
    throw error;
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('Email already registered');
    (error as any).statusCode = 400;
    throw error;
  }

  const user = new User({ email, password, name });
  await user.save();

  const token = generateToken(user._id.toString());
  res.cookie(TOKEN_NAME, token, COOKIE_OPTIONS);
  res.status(201).json({ user: user.toJSON() });
}));

router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    const error = new Error('Email and password required');
    (error as any).statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error('Invalid credentials');
    (error as any).statusCode = 401;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid credentials');
    (error as any).statusCode = 401;
    throw error;
  }

  const token = generateToken(user._id.toString());
  res.cookie(TOKEN_NAME, token, COOKIE_OPTIONS);
  res.json({ user: user.toJSON() });
}));

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie(TOKEN_NAME);
  res.json({ message: 'Logged out' });
});

router.get('/me', authenticate, asyncHandler(async (req: any, res: Response) => {
  res.json(req.user.toJSON());
}));

export default router;