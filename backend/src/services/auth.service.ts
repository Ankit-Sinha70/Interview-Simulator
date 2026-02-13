
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/user.model';

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
