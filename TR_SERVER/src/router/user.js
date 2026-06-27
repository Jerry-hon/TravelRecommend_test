import express from 'express';
import userService from '../service/userService.js';

const router = express.Router();

// 发送验证码
router.post('/send-code', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: '邮箱不能为空' });
  }
  const result = await userService.sendCode(email);
  res.json(result);
});

// 登录/注册
router.post('/login', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, error: '邮箱和验证码不能为空' });
  }
  const result = userService.login(email, code);
  if (!result.success) {
    return res.status(401).json(result);
  }
  res.json(result);
});

// 获取用户信息（通过 token）
router.get('/info', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = userService.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ success: false, error: '未登录或 token 已过期' });
  }
  res.json({ success: true, data: user });
});

export default router;
