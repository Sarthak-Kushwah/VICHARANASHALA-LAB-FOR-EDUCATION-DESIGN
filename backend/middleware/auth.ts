import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User, { type IUser, type UserRole } from '../models/User.js';
import '../types/express.js'; // picks up the global Request interface

// Express middleware to protect routes requiring authentication
export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.status(401).json({ message: 'User not found.' });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Not authorized. Invalid token.' });
  }
};

// Express middleware to restrict access to specific roles (RBAC)
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized. No user context.' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: `Forbidden. Role '${req.user.role}' is not authorized.` });
      return;
    }
    next();
  };
};
