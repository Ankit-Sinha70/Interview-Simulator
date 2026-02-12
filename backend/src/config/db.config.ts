import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/interview-simulator';

/**
 * Connect to MongoDB with retry logic
 */
export async function connectDatabase(): Promise<void> {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('[DB] Connected to MongoDB');
    } catch (error) {
        console.error('[DB] MongoDB connection failed:', (error as Error).message);
        console.log('[DB] Retrying in 5 seconds...');
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return connectDatabase();
    }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectDatabase(): Promise<void> {
    await mongoose.disconnect();
    console.log('[DB] Disconnected from MongoDB');
}
