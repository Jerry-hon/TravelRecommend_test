import db from '../db/database.js';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import 'dotenv/config';

// 初始化邮件发送器
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

class UserService {
  // 生成 6 位随机验证码
  generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  // 发送验证码：生成代码存入数据库，5 分钟有效，同一邮箱旧码自动失效
  async sendCode(email) {
    db.prepare('UPDATE verify_codes SET used = 1 WHERE email = ?').run(email);

    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    db.prepare(
      'INSERT INTO verify_codes (email, code, expires_at) VALUES (?, ?, ?)'
    ).run(email, code, expiresAt);

    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Travel AI 登录验证码',
        html: `
          <div style="padding: 20px; font-family: Arial;">
            <h3>Travel AI 验证码</h3>
            <p style="font-size: 24px; font-weight: bold; color: #1989fa;">${code}</p>
            <p style="color: #666;">验证码 5 分钟内有效，请勿泄露给他人。</p>
          </div>
        `,
      });
    } catch (err) {
      logger.error('邮件发送失败', { email, error: err.message });
      return { success: false, error: '验证码发送失败，请稍后重试' };
    }

    return { success: true, message: '验证码已发送' };
  }

  // 登录/注册：验证码正确则查找用户，不存在则自动注册
  login(email, code) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: '邮箱格式不正确' };
    }

    const record = db.prepare(
      `SELECT * FROM verify_codes 
       WHERE email = ? AND code = ? AND used = 0 AND expires_at > datetime('now')
       ORDER BY id DESC LIMIT 1`
    ).get(email, code);

    if (!record) {
      return { success: false, error: '验证码错误或已过期' };
    }

    db.prepare('UPDATE verify_codes SET used = 1 WHERE id = ?').run(record.id);

    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      const result = db.prepare(
        'INSERT INTO users (email) VALUES (?)'
      ).run(email);
      user = {
        id: result.lastInsertRowid,
        email,
        nickname: '',
        created_at: new Date().toISOString(),
      };
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    db.prepare('UPDATE users SET token = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(token, user.id);

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        token,
      },
    };
  }

  // 根据邮箱获取用户信息
  getUserByEmail(email) {
    if (!email) return null;
    return db.prepare(
      'SELECT id, email, nickname, created_at FROM users WHERE email = ?'
    ).get(email);
  }
}

export default new UserService();
