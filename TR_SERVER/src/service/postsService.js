import db from '../db/database.js'
import userService from './userService.js';

class PostService {
    getUserId(token) {
        const user = userService.getUserByToken(token);
        return user ? user.id : null;
    }

    showMyPosts(token){
        const userId = this.getUserId(token);
        if (!userId) {
            return { success: false, error: '未登录或 token 已过期' };
        }
        const rows = db.prepare(
            `SELECT id, title, content, created_at FROM posts WHERE user_id = ? ORDER BY created_at DESC`
        ).all(userId);
        return { success: true, data: rows };
    } 

    showPostDetail(postId){
        const row = db.prepare(
            `SELECT id, title, content, created_at FROM posts WHERE id = ?`
        ).get(postId);
        if (!row) {
            return { success: false, error: '帖子不存在' };
        }
        const replies = db.prepare(
            `SELECT id, user_id, content, created_at FROM replies WHERE post_id = ? ORDER BY created_at ASC`
        ).all(postId);
        return { success: true, data: { ...row, replies } };
    }

    showPosts(page = 1, pageSize = 10){
        const offset = (page - 1) * pageSize
        const rows = db.prepare(
            `SELECT id, title, content, created_at FROM posts ORDER BY created_at DESC LIMIT ? OFFSET ?`
        ).all(pageSize, offset);
        const total = db.prepare(`SELECT COUNT(*) as count FROM posts`).get().count
        return {
            list: rows,
            total,
            page,
            pageSize,
            hasMore: offset + pageSize < total
        };
    }

    createPost(token, title, content){
        const userId = this.getUserId(token);
        if (!userId) {
            return { success: false, error: '未登录或 token 已过期' };
        }
        const result = db.prepare(
            'INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)'
        ).run(userId, title, content);
        return {
            success: true,
            data: { id: result.lastInsertRowid }
        };
    }

    deletePost(token, postId){
        const userId = this.getUserId(token);
        if (!userId) {
            return { success: false, error: '未登录或 token 已过期' };
        }
        db.prepare('DELETE FROM posts WHERE id = ? AND user_id = ?').run(postId, userId);
        return {
            success: true,
            data: { id: postId }
        };
    }

    postReply(token, postId, content){
        const userId = this.getUserId(token);
        if (!userId) {
            return { success: false, error: '未登录或 token 已过期' };
        }
        const result = db.prepare(
            'INSERT INTO replies (user_id, post_id, content) VALUES (?, ?, ?)'
        ).run(userId, postId, content);
        return {
            success: true,
            data: { id: result.lastInsertRowid }
        };
    }

    deleteReply(token, replyId){
        const userId = this.getUserId(token);
        if (!userId) {
            return { success: false, error: '未登录或 token 已过期' };
        }
        db.prepare('DELETE FROM replies WHERE id = ? AND user_id = ?').run(replyId, userId);
        return {
            success: true,
            data: { id: replyId }
        };
    }
}

export default new PostService();
