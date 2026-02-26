import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { SubscriptionPlan } from '../models/subscriptionPlan.model';
import bcrypt from 'bcrypt';

/**
 * GET /api/users/me
 * Returns current user's profile info (no password hash)
 */
export async function getMe(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        // Select all fields EXCEPT passwordHash and reset tokens
        const user = await User.findById(userId).select('-passwordHash -resetPasswordToken -resetPasswordExpires');
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/users/update-profile
 * Updates basic profile info like name
 */
export async function updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const { name } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, error: 'Name is required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        user.name = name.trim();
        user.updatedAt = new Date();
        await user.save();

        const updatedUser = await User.findById(userId).select('-passwordHash -resetPasswordToken -resetPasswordExpires');
        res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/users/change-password
 * Changes password securely, verifying old password. Local users only.
 */
export async function changePassword(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, error: 'Current password and new password are required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        if (user.provider !== 'local') {
            return res.status(403).json({
                success: false,
                error: `Password cannot be changed. This account is managed via ${user.provider}.`
            });
        }

        if (!user.passwordHash) {
            return res.status(500).json({ success: false, error: 'No password hash found for local user' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Incorrect current password' });
        }

        // Validate new password strength
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

        // Hash and save new password
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        user.passwordHash = newPasswordHash;
        user.updatedAt = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/users/profile-picture
 * Uploads and saves a base64 encoded profile picture
 */
export async function uploadProfilePicture(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const { profilePicture } = req.body;
        if (!profilePicture) {
            return res.status(400).json({ success: false, error: 'Profile picture is required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        user.profilePicture = profilePicture;
        user.updatedAt = new Date();
        await user.save();

        const updatedUser = await User.findById(userId).select('-passwordHash -resetPasswordToken -resetPasswordExpires');
        res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/users/welcome-offer-status
 * Returns whether the welcome offer popup should be shown
 */
export async function getWelcomeOfferStatus(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const now = new Date();
        const showOffer =
            user.planType === 'FREE' &&
            !user.hasSeenWelcomeOffer &&
            !user.hasEverSubscribed &&
            !!user.welcomeOfferExpiresAt &&
            user.welcomeOfferExpiresAt > now;

        let savings: number | null = null;
        if (showOffer) {
            const yearlyPlan = await SubscriptionPlan.findOne({ billingCycle: 'YEARLY', isActive: true });
            if (yearlyPlan) {
                savings = Math.round(yearlyPlan.price * 0.30);
            }
        }

        res.status(200).json({
            success: true,
            data: {
                showOffer,
                expiresAt: showOffer ? user.welcomeOfferExpiresAt!.toISOString() : null,
                savings,
            }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/users/dismiss-welcome-offer
 * Marks the welcome offer as seen so it won't appear again
 */
export async function dismissWelcomeOffer(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        await User.findByIdAndUpdate(userId, { hasSeenWelcomeOffer: true });
        res.status(200).json({ success: true, message: 'Welcome offer dismissed' });
    } catch (error) {
        next(error);
    }
}
