import { Pool } from "pg";
import { Client as SSHClient } from "ssh2";
import dotenv from "dotenv";
import logger from "../utils/logger.js";
import net from "net";

dotenv.config();

let sshConnection;
let localServer;
let dbClient;
let localPort;

const MAX_RETRIES = 3;
const RETRY_DELAY = 3000; // ms

async function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

async function initDB(retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.info("[INFO] Setting up SSH connection...");

      sshConnection = new SSHClient();
      localPort = await findFreePort();

      await new Promise((resolve, reject) => {
        sshConnection
          .on("ready", () => {
            logger.info("[INFO] SSH ready, setting up local tunnel...");

            // Detect unexpected SSH death
            sshConnection.on("close", () => {
              logger.error("[ERROR] SSH connection closed unexpectedly.");
            });

            sshConnection.on("end", () => {
              logger.error("[ERROR] SSH connection ended.");
            });

            localServer = net.createServer((socket) => {
              sshConnection.forwardOut(
                socket.remoteAddress || "127.0.0.1",
                socket.remotePort || 0,
                process.env.DB_HOST,
                Number(process.env.DB_PORT),
                (err, stream) => {
                  if (err) {
                    logger.error("[ERROR] forwardOut failed:", err.message);
                    socket.destroy();
                    return;
                  }

                  // Safer cleanup handler
                  let closed = false;
                  const safeClose = () => {
                    if (closed) return;
                    closed = true;
                    socket.destroy();
                    stream.destroy();
                  };

                  // Pipe traffic
                  socket.pipe(stream).pipe(socket);

                  // Handle all termination paths
                  stream.on("error", (err) => {
                    logger.error("[ERROR] SSH stream error:", err.message);
                    safeClose();
                  });

                  socket.on("error", () => {
                    safeClose();
                  });

                  stream.on("close", safeClose);
                  socket.on("close", safeClose);
                },
              );
            });

            localServer.listen(localPort, "127.0.0.1", () => {
              logger.info(
                `[SUCCESS] Local port ${localPort} forwarding to remote DB`,
              );
              resolve();
            });

            localServer.on("error", reject);
          })
          .on("error", reject)
          .connect({
            host: process.env.SSH_HOST,
            port: Number(process.env.SSH_PORT) || 22,
            username: process.env.SSH_USER,
            password: process.env.SSH_PASSWORD,
            keepaliveInterval: 20000,
            readyTimeout: 30000,
          });
      });

      // Create Postgres pool
      dbClient = new Pool({
        host: "127.0.0.1",
        port: localPort,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        keepAlive: true,
        keepAliveInitialDelayMillis: 30000,
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      // Pool-level error handling
      dbClient.on("error", (err) => {
        logger.error("[ERROR] Unexpected PG pool error:", err.message);
      });

      // Test connection
      await dbClient.query("SELECT 1");

      logger.info("[SUCCESS] Database connected via SSH tunnel!");
      return dbClient;
    } catch (err) {
      logger.warn(`[WARN] Attempt ${attempt} failed: ${err.message}`);
      await closeDB();

      if (attempt === retries) {
        logger.error("[ERROR] Failed to connect after maximum retries.");
        throw err;
      }

      logger.info(`[INFO] Retrying in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY));
    }
  }
}

async function closeDB() {
  if (dbClient) {
    await dbClient.end().catch(() => {});
    logger.info("[INFO] Postgres pool closed.");
    dbClient = null;
  }

  if (localServer) {
    localServer.close();
    logger.info("[INFO] Local forwarding server closed.");
    localServer = null;
  }

  if (sshConnection) {
    sshConnection.end();
    logger.info("[INFO] SSH connection closed.");
    sshConnection = null;
  }
}

process.on("SIGINT", async () => {
  logger.info("[INFO] Gracefully shutting down (SIGINT)...");
  await closeDB();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("[INFO] Gracefully shutting down (SIGTERM)...");
  await closeDB();
  process.exit(0);
});

export { initDB, closeDB };
