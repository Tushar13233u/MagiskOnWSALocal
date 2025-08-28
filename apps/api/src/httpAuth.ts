import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './auth';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers['authorization'] as string | undefined;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  const userId = token ? verifyToken(token) : null;
  if (!userId) return res.status(401).json({ error: 'unauthorized' });
  (req as any).userId = userId;
  next();
}

export function getUserId(req: Request): string {
  return (req as any).userId as string;
}

