
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
        res.status(201).json({
            success: true,
            message: result.message,
            requiresLogin: result.requiresLogin
        });
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
        if (error.message === 'Invalid credentials' || error.message === 'Please login using your connected OAuth provider') {
            return res.status(401).json({ success: false, error: error.message });
        }
        next(error);
    }
}

/**
 * POST /api/auth/google
 */
export async function googleLogin(req: Request, res: Response, next: NextFunction) {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({ success: false, error: 'idToken is required' });
        }

        const result = await authService.googleLogin(idToken);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        if (error.message === 'Invalid Google token') {
            return res.status(401).json({ success: false, error: error.message });
        }
        // If it's a "Email already in use" type of error, handle similarly (though linked automatically)
        next(error);
    }
}

/**
 * POST /api/auth/meta
 */
export async function metaLogin(req: Request, res: Response, next: NextFunction) {
    try {
        const { accessToken } = req.body;
        if (!accessToken) {
            return res.status(400).json({ success: false, error: 'accessToken is required' });
        }

        const result = await authService.metaLogin(accessToken);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        if (error.message === 'Invalid Meta token' || error.message === 'Email not provided by Meta') {
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

/**
 * POST /api/auth/forgot-password
 * Non-enumerable: always returns the same message regardless of whether email exists
 */
export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }

        await authService.forgotPassword(email);

        // SECURITY: Always return success — never reveal if email exists
        res.status(200).json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.',
        });
    } catch (error: any) {
        if (error.message.includes('Failed to send')) {
            return res.status(500).json({ success: false, error: error.message });
        }
        // For any other unexpected error, still send generic success to prevent enumeration
        res.status(200).json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.',
        });
    }
}

/**
 * GET /api/auth/validate-reset-token?token=...
 */
export async function validateResetToken(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.query.token as string;
        if (!token) {
            return res.status(400).json({ success: false, error: 'Token is required' });
        }

        const isValid = await authService.validateResetToken(token);
        res.status(200).json({ success: true, valid: isValid });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/auth/reset-password
 * Validates password strength before resetting
 */
export async function resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ success: false, error: 'Token and new password are required' });
        }

        // Password strength validation
        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
        }
        if (!/[A-Z]/.test(newPassword)) {
            return res.status(400).json({ success: false, error: 'Password must contain at least one uppercase letter' });
        }
        if (!/[a-z]/.test(newPassword)) {
            return res.status(400).json({ success: false, error: 'Password must contain at least one lowercase letter' });
        }
        if (!/[0-9]/.test(newPassword)) {
            return res.status(400).json({ success: false, error: 'Password must contain at least one number' });
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
            return res.status(400).json({ success: false, error: 'Password must contain at least one special character' });
        }

        await authService.resetPassword(token, newPassword);

        res.status(200).json({
            success: true,
            message: 'Password has been reset successfully. You can now log in with your new password.',
        });
    } catch (error: any) {
        if (error.message === 'Invalid or expired reset token') {
            return res.status(400).json({ success: false, error: error.message });
        }
        next(error);
    }
}
