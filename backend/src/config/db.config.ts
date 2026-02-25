import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/interview-simulator';

let _isConnected = false;

export function isDbConnected(): boolean {
    return _isConnected;
}

export async function connectDatabase(): Promise<void> {
    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        _isConnected = true;
        console.log('[DB] ✅ Connected to MongoDB');
    } catch (error) {
        console.error('[DB] ❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
}

export async function disconnectDatabase(): Promise<void> {
    if (_isConnected) {
        await mongoose.disconnect();
        _isConnected = false;
        console.log('[DB] Disconnected from MongoDB');
    }
}
