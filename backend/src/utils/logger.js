import pino from 'pino';

const logger = pino({
  level: 'info', // default minimum level
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      levelFirst: true,
    },
  },
});

// sanity check: ensure all levels exist
['info', 'warn', 'error', 'debug'].forEach(level => {
  if (!logger[level]) {
    logger[level] = (...args) => logger.info(...args);
  }
});

export default logger;