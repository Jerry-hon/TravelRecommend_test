import express from 'express';
import travelRouter from './router/travel.js';
import userRouter from './router/user.js';
import planRouter from './router/plan.js';
import postsRouter from './router/posts.js';
import { requestLogger } from './middleware/requestLogger.js';
import logger from './utils/logger.js';
import 'dotenv/config';
import cors from 'cors';

const app = express();
const port = process.env.PORT;

// 中间件
app.use(express.json(), cors({ origin: '*' }));
app.use(requestLogger);

// 健康检查
app.get('/api/heartbeat', (req, res) => {
  res.json({ heartbeat: 'pong', timestamp: Date.now() });
});

// 路由
app.use('/api/travel', travelRouter);
app.use('/api/user', userRouter);
app.use('/api/plan', planRouter);
app.use('/api/posts', postsRouter);

app.listen(port, () => {
  logger.info('Server started', { port, env: process.env.NODE_ENV || 'development' });
});
