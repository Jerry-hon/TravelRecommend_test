import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

export const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        logger.debug('请求缺少 Token', { path: req.path });
        return res.status(401).json({ success: false, error: '请先登录' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        logger.debug('Token 验证失败', { path: req.path, error: err.message });
        return res.status(401).json({ success: false, error: '登录已过期，请重新登录' });
    }
}
