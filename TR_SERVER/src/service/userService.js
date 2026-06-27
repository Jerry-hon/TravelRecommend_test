import db from '../db/database.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import 'dotenv/config';

// 初始化邮件发送器
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true, // 465 端口使用 SSL
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

  // 生成随机 token
  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // 发送验证码：生成代码存入数据库，5 分钟有效，同一邮箱旧码自动失效
  async sendCode(email) {
    // 同一邮箱的旧验证码标记为已使用
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
      console.error('邮件发送失败:', err.message);
      return { success: false, error: '验证码发送失败，请稍后重试' };
    }

    return { success: true, message: '验证码已发送' };
  }

  // 登录/注册：验证码正确则查找用户，不存在则自动注册
  login(email, code) {
    // 验证邮箱格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: '邮箱格式不正确' };
    }

    // 查找有效验证码
    const record = db.prepare(
      `SELECT * FROM verify_codes 
       WHERE email = ? AND code = ? AND used = 0 AND expires_at > datetime('now')
       ORDER BY id DESC LIMIT 1`
    ).get(email, code);

    if (!record) {
      return { success: false, error: '验证码错误或已过期' };
    }

    // 标记验证码已使用
    db.prepare('UPDATE verify_codes SET used = 1 WHERE id = ?').run(record.id);

    // 查找用户，不存在则创建
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    const token = this.generateToken();

    if (user) {
      // 老用户：更新 token
      db.prepare(
        "UPDATE users SET token = ?, updated_at = datetime('now') WHERE id = ?"
      ).run(token, user.id);
      user.token = token;
    } else {
      // 新用户：自动注册
      const result = db.prepare(
        'INSERT INTO users (email, token) VALUES (?, ?)'
      ).run(email, token);
      user = {
        id: result.lastInsertRowid,
        email,
        nickname: '',
        token,
        created_at: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        token: user.token,
      },
    };
  }

  // 根据 token 获取用户信息
  getUserByToken(token) {
    if (!token) return null;
    return db.prepare(
      'SELECT id, email, nickname, created_at FROM users WHERE token = ?'
    ).get(token);
  }
}

export default new UserService();
