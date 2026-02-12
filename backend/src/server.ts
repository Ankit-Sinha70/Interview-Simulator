import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDatabase } from './config/db.config';
import { seedPromptVersions } from './services/promptVersion.service';

const PORT = process.env.PORT || 5000;

async function startServer() {
    // Connect to MongoDB
    await connectDatabase();

    // Seed prompt versions if none exist
    await seedPromptVersions();

    app.listen(PORT, () => {
        console.log(`🚀 Interview Simulator Backend running on port ${PORT}`);
        console.log(`📡 API: http://localhost:${PORT}/api`);
        console.log(`💚 Health: http://localhost:${PORT}/api/health`);
    });
}

startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
