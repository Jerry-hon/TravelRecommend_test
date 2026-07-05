import db from '../db/database.js'
import userService from './userService.js';

class PostService {
    getUserId(email) {
        const user = userService.getUserByEmail(email);
        return user ? user.id : null;
    }

    showMyPosts(email){
        const userId = this.getUserId(email);
        if (!userId) {
            return { success: false, error: '未登录或用户不存在' };
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

    createPost(email, title, content){
        const userId = this.getUserId(email);
        if (!userId) {
            return { success: false, error: '未登录或用户不存在' };
        }
        const result = db.prepare(
            'INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)'
        ).run(userId, title, content);
        return {
            success: true,
            data: { id: result.lastInsertRowid }
        };
    }

    deletePost(email, postId){
        const userId = this.getUserId(email);
        if (!userId) {
            return { success: false, error: '未登录或用户不存在' };
        }
        db.prepare('DELETE FROM posts WHERE id = ? AND user_id = ?').run(postId, userId);
        return {
            success: true,
            data: { id: postId }
        };
    }

    postReply(email, postId, content){
        const userId = this.getUserId(email);
        if (!userId) {
            return { success: false, error: '未登录或用户不存在' };
        }
        const result = db.prepare(
            'INSERT INTO replies (user_id, post_id, content) VALUES (?, ?, ?)'
        ).run(userId, postId, content);
        return {
            success: true,
            data: { id: result.lastInsertRowid }
        };
    }

    deleteReply(email, replyId){
        const userId = this.getUserId(email);
        if (!userId) {
            return { success: false, error: '未登录或用户不存在' };
        }
        db.prepare('DELETE FROM replies WHERE id = ? AND user_id = ?').run(replyId, userId);
        return {
            success: true,
            data: { id: replyId }
        };
    }
}

export default new PostService();
