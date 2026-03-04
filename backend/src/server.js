import app from "./app.js";
import pino from "pino";

const PORT = process.env.PORT || 3000;
const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      levelFirst: true,
      translateTime: true,
    },
  },
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:');
  console.error(error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
});

const server = app.listen(PORT, () => {
  logger.info(`Backend is running on port ${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('SERVER ERROR:');
  console.error(error);
});

