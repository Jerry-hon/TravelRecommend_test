import db from '../db/database.js';
import userService from './userService.js';

class PlanService {
  getUserId(email) {
    const user = userService.getUserByEmail(email);
    return user ? user.id : null;
  }

  save(email, destination, budget, days, planData) {
    const userId = this.getUserId(email);
    if (!userId) {
      return { success: false, error: '未登录或用户不存在' };
    }

    const result = db.prepare(
      'INSERT INTO travel_plans (user_id, destination, budget, days, plan_data) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, destination, budget, days, JSON.stringify(planData));

    return {
      success: true,
      data: { id: result.lastInsertRowid }
    };
  }

  list(email) {
    const userId = this.getUserId(email);
    if (!userId) {
      return { success: false, error: '未登录或用户不存在' };
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

  getById(email, planId) {
    const userId = this.getUserId(email);
    if (!userId) {
      return { success: false, error: '未登录或用户不存在' };
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

  delete(email, planId) {
    const userId = this.getUserId(email);
    if (!userId) {
      return { success: false, error: '未登录或用户不存在' };
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
