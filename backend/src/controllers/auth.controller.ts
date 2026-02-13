
import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';

/**
 * POST /api/auth/register
 */
export async function register(req: Request, res: Response, next: NextFunction) {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, error: 'Missing fields' });
        }

        const result = await authService.register(name, email, password);
        res.status(201).json({ success: true, data: result });
    } catch (error: any) {
        if (error.message === 'Email already registered') {
            return res.status(409).json({ success: false, error: error.message });
        }
        next(error);
    }
}

/**
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Missing fields' });
        }

        const result = await authService.login(email, password);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        if (error.message === 'Invalid credentials') {
            return res.status(401).json({ success: false, error: error.message });
        }
        next(error);
    }
}

/**
 * GET /api/auth/me
 */
export async function getMe(req: Request, res: Response, next: NextFunction) {
    try {
        // userId is attached by authMiddleware
        const userId = (req as any).user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const user = await authService.getUserById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
}
