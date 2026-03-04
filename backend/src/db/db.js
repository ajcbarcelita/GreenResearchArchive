import { Client as PgClient } from 'pg';
import { Client as SSHClient } from 'ssh2';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
import net from 'net';

dotenv.config();

let sshConnection;
let localServer;
let dbClient;
let localPort; // dynamically assigned

const MAX_RETRIES = 3;
const RETRY_DELAY = 3000; // ms

async function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

async function initDB(retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.info('[INFO] Setting up SSH connection...');

      sshConnection = new SSHClient();

      localPort = await findFreePort();

      await new Promise((resolve, reject) => {
        sshConnection
          .on('ready', () => {
            logger.info('[INFO] SSH ready, forwarding local port...');
            sshConnection.forwardOut(
              '127.0.0.1',
              localPort,
              process.env.DB_HOST,
              Number(process.env.DB_PORT),
              (err, stream) => {
                if (err) return reject(err);

                // Wrap a local TCP server to forward DB traffic
                localServer = net.createServer((socket) => {
                  socket.pipe(stream).pipe(socket);
                });

                localServer.listen(localPort, '127.0.0.1', () => {
                  logger.info(`[SUCCESS] Local port ${localPort} forwarded to remote DB`);
                  resolve();
                });

                localServer.on('error', reject);
              }
            );
          })
          .on('error', reject)
          .connect({
            host: process.env.SSH_HOST,
            port: Number(process.env.SSH_PORT) || 22,
            username: process.env.SSH_USER,
            password: process.env.SSH_PASSWORD,
            keepaliveInterval: 20000,
            readyTimeout: 30000,
          });
      });

      // Connect Postgres via forwarded port
      dbClient = new PgClient({
        host: '127.0.0.1',
        port: localPort,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      });

      await dbClient.connect();
      logger.info('[SUCCESS] Database connected via SSH tunnel!');
      return dbClient;

    } catch (err) {
      logger.warn(`[WARN] Attempt ${attempt} failed: ${err.message}`);
      await closeDB(); // close any leftover connections before retry
      if (attempt === retries) {
        logger.error('[ERROR] Failed to connect after maximum retries.');
        throw err;
      }
      logger.info(`[INFO] Retrying in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise(r => setTimeout(r, RETRY_DELAY));
    }
  }
}

async function closeDB() {
  if (dbClient) {
    await dbClient.end().catch(() => {});
    logger.info('[INFO] Postgres connection closed.');
    dbClient = null;
  }
  if (localServer) {
    localServer.close();
    logger.info('[INFO] Local forwarding server closed.');
    localServer = null;
  }
  if (sshConnection) {
    sshConnection.end();
    logger.info('[INFO] SSH connection closed.');
    sshConnection = null;
  }
}

process.on('SIGINT', async () => {
  logger.info('[INFO] Gracefully shutting down (SIGINT)...');
  await closeDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('[INFO] Gracefully shutting down (SIGTERM)...');
  await closeDB();
  process.exit(0);
});

export { initDB, closeDB };