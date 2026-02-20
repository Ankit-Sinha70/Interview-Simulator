
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser } from '../models/user.model';
import { sendPasswordResetEmail } from '../utils/email';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';
const SALT_ROUNDS = 10;

export async function register(name: string, email: string, password: string): Promise<{ token: string, user: IUser }> {
    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
        throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = new User({
        name,
        email,
        passwordHash,
    });
    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return { token, user };
}

export async function login(email: string, password: string): Promise<{ token: string, user: IUser }> {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }

    // Generate token
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return { token, user };
}

export async function verifyToken(token: string): Promise<any> {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        throw new Error('Invalid token');
    }
}

export async function getUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId).select('-passwordHash');
}

// ─── Forgot Password ───

export async function forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email });

    // SECURITY: Always return silently — never reveal if email exists
    if (!user) {
        console.log(`[Auth] Forgot password requested for unknown email: ${email}`);
        return;
    }

    // Generate cryptographically secure token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token before storing (never store raw)
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Store hashed token + 30 minute expiry
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    // Send email with RAW token (not the hash)
    try {
        await sendPasswordResetEmail(user.email, resetToken);
    } catch (err) {
        console.error('[Auth] Failed to send reset email:', err);
        // Clear the token so the user can retry
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        throw new Error('Failed to send reset email. Please try again later.');
    }
}

// ─── Validate Reset Token ───

export async function validateResetToken(token: string): Promise<boolean> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: new Date() },
    });

    return !!user;
}

// ─── Reset Password ───

export async function resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
        throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Invalidate token immediately (one-time use)
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    console.log(`[Auth] Password reset successfully for user ${user._id}`);
}

