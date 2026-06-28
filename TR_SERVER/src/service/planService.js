import db from '../db/database.js';
import userService from './userService.js';

class PlanService {
  getUserId(token) {
    const user = userService.getUserByToken(token);
    return user ? user.id : null;
  }

  save(token, destination, budget, days, planData) {
    const userId = this.getUserId(token);
    if (!userId) {
      return { success: false, error: '未登录或 token 已过期' };
    }

    const result = db.prepare(
      'INSERT INTO travel_plans (user_id, destination, budget, days, plan_data) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, destination, budget, days, JSON.stringify(planData));

    return {
      success: true,
      data: { id: result.lastInsertRowid }
    };
  }

  list(token) {
    const userId = this.getUserId(token);
    if (!userId) {
      return { success: false, error: '未登录或 token 已过期' };
    }

    const rows = db.prepare(
      `SELECT id, destination, budget, days, plan_data, created_at 
       FROM travel_plans WHERE user_id = ? ORDER BY created_at DESC`
    ).all(userId);

    return {
      success: true,
      data: rows.map(row => ({
        id: row.id,
        destination: row.destination,
        budget: row.budget,
        days: row.days,
        planData: JSON.parse(row.plan_data),
        createdAt: row.created_at,
      }))
    };
  }

  getById(token, planId) {
    const userId = this.getUserId(token);
    if (!userId) {
      return { success: false, error: '未登录或 token 已过期' };
    }

    const row = db.prepare(
      'SELECT * FROM travel_plans WHERE id = ? AND user_id = ?'
    ).get(planId, userId);

    if (!row) {
      return { success: false, error: '方案不存在' };
    }

    return {
      success: true,
      data: {
        id: row.id,
        destination: row.destination,
        budget: row.budget,
        days: row.days,
        planData: JSON.parse(row.plan_data),
        createdAt: row.created_at,
      }
    };
  }

  delete(token, planId) {
    const userId = this.getUserId(token);
    if (!userId) {
      return { success: false, error: '未登录或 token 已过期' };
    }

    const plan = db.prepare('SELECT id FROM travel_plans WHERE id = ? AND user_id = ?').get(planId, userId);
    if (!plan) {
      return { success: false, error: '方案不存在' };
    }

    db.prepare('DELETE FROM travel_plans WHERE id = ?').run(planId);
    return { success: true };
  }
}

export default new PlanService();
