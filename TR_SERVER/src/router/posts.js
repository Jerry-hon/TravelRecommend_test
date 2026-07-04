import express from 'express';
import postService from '../service/postsService.js';
import userService from '../service/userService.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

const getToken = (req) => req.headers.authorization?.replace('Bearer ', '');

router.get('/my', verifyToken, async (req, res) => {
    const token = getToken(req);
    const result = await postService.showMyPosts(token);
    if (!result.success) {
        return res.status(401).json(result);
    }
    res.json(result);
});

router.get('/detail/:id', async (req, res) => {
    const postId = Number(req.params.id);
    const result = await postService.showPostDetail(postId);
    if (!result.success) {
        return res.status(404).json(result);
    }
    res.json(result);
});

router.get('/list', async (req, res) => {
    const token = getToken(req);
    const page = req.query.page || 1;
    const pageSize = req.query.pageSize || 10;
    const posts = await postService.showPosts(page, pageSize);
    res.json({ success: true, data: posts });
});

router.post('/create', verifyToken, async (req, res) => {
    const token = getToken(req);
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({ success: false, error: '标题和内容不能为空' });
    }
    const result = await postService.createPost(token, title, content);
    res.json(result);
});

router.post('/delete/:id', verifyToken, async (req, res) => {
    const token = getToken(req);
    const postId = req.params.id;
    const result = await postService.deletePost(token, postId);
    res.json(result);
});

router.post('/reply/:id', verifyToken, async (req, res) => {
    const token = getToken(req);
    const postId = req.params.id;
    const { content } = req.body;
    if (!content) {
        return res.status(400).json({ success: false, error: '评论内容不能为空' });
    }
    const result = await postService.postReply(token, postId, content);
    res.json(result);
});

router.post('/delete-reply/:id', verifyToken, async (req, res) => {
    const token = getToken(req);
    const replyId = req.params.id;
    const result = await postService.deleteReply(token, replyId);
    res.json(result);
});

export default router;