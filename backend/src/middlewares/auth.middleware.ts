
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
    };
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ success: false, error: 'Unauthorized: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        (req as AuthRequest).user = {
            userId: decoded.userId,
            email: decoded.email
        };
        next();
    } catch (err) {
        return res.status(403).json({ success: false, error: 'Forbidden: Invalid token' });
    }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
    const user = (req as AuthRequest).user;
    if (!user || !user.email) {
        return res.status(401).json({ success: false, error: 'Unauthorized: No user found' });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || user.email !== adminEmail) {
        return res.status(403).json({ success: false, error: 'Forbidden: Admin access only' });
    }

    next();
}
