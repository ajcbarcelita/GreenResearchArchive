import app from './app.js';
import pino from 'pino';

const PORT = process.env.PORT || 3000;
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      levelFirst: true,
      translateTime: true
    }
  }
})

app.listen(PORT, () => {
  logger.info(`Backend is running on port ${PORT}`);
});