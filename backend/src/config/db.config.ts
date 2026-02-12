import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/interview-simulator';

let _isConnected = false;

/**
 * Check if MongoDB is connected
 */
export function isDbConnected(): boolean {
    return _isConnected;
}

/**
 * Connect to MongoDB with graceful fallback
 */
export async function connectDatabase(): Promise<void> {
    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // Fail fast if no server
        });
        _isConnected = true;
        console.log('[DB] ✅ Connected to MongoDB');
    } catch (error) {
        _isConnected = false;
        console.warn('[DB] ⚠️  MongoDB not available — using in-memory fallback');
        console.warn(`[DB]    Tried: ${MONGODB_URI}`);
        console.warn('[DB]    Install MongoDB or set MONGODB_URI in .env to persist data');
    }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectDatabase(): Promise<void> {
    if (_isConnected) {
        await mongoose.disconnect();
        _isConnected = false;
        console.log('[DB] Disconnected from MongoDB');
    }
}
