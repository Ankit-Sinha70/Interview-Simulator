import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDatabase } from './config/db.config';
import { seedPromptVersions } from './services/promptVersion.service';
import { autoAbandonStaleSessions } from './services/interview.service';

const PORT = process.env.PORT || 5000;

async function startServer() {
    // Connect to MongoDB
    await connectDatabase();

    // Seed prompt versions if none exist
    await seedPromptVersions();

    // Auto-abandon stale sessions on startup + every 30 minutes
    autoAbandonStaleSessions().catch(err => console.error('[AutoAbandon] Startup error:', err));
    setInterval(() => {
        autoAbandonStaleSessions().catch(err => console.error('[AutoAbandon] Error:', err));
    }, 30 * 60 * 1000);

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
