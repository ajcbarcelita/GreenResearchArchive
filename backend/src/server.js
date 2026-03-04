// src/server.js
import app from './app.js';
import logger from './utils/logger.js';
import { initDB, closeDB } from './db/db.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    logger.info('[INFO] Initializing database connection...');
    const dbClient = await initDB(); // wait for SSH tunnel + DB ready
    // Optionally attach dbClient to app locals if needed
    app.locals.db = dbClient;

    const server = app.listen(PORT, () => {
      logger.info(`[SUCCESS] Backend is running on port ${PORT}`);
    });

    // Handle server errors
    server.on('error', (error) => {
      logger.error('[ERROR] Server error:');
      logger.error(error);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('[INFO] Shutting down server...');
      server.close(async () => {
        await closeDB();
        logger.info('[INFO] Server closed, exiting process.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (err) {
    logger.error('[ERROR] Failed to start backend:');
    logger.error(err);
    await closeDB();
    process.exit(1);
  }
}

startServer();