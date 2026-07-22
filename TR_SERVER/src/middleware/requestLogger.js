// HTTP 请求日志中间件
// 记录每个请求的 method、path、状态码、响应时间（毫秒）

import logger from '../utils/logger.js';

export function requestLogger(req, res, next) {
  const start = Date.now();

  // 响应结束时记录
  res.on('finish', () => {
    const duration = Date.now() - start;
    const isApi = req.path.startsWith('/api/');

    if (!isApi) return; // 仅记录 API 请求

    logger.info(`${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      ip: req.ip || req.socket.remoteAddress,
    });
  });

  next();
}
