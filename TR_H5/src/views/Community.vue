<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { postsGet, postsPost } from '../utils/request'
import { userGet } from '../utils/request'

const router = useRouter()

const active = ref(2)
const isLoading = ref(false)
const isLogin = ref(false)
const currentUserId = ref(null)

const getAvatarColor = (index) => {
    const colors = [
        'linear-gradient(135deg, #ff6b35, #f7931e)',
        'linear-gradient(135deg, #667eea, #764ba2)',
        'linear-gradient(135deg, #2ecc71, #27ae60)',
        'linear-gradient(135deg, #e74c3c, #c0392b)',
        'linear-gradient(135deg, #3498db, #2980b9)',
        'linear-gradient(135deg, #f39c12, #e67e22)',
        'linear-gradient(135deg, #1abc9c, #16a085)',
        'linear-gradient(135deg, #9b59b6, #8e44ad)',
    ]
    return colors[index % colors.length]
}

// 帖子列表
const posts = ref([])
const page = ref(1)
const hasMore = ref(true)
const loadingMore = ref(false)

// 发布帖子弹窗
const showCreate = ref(false)
const newTitle = ref('')
const newContent = ref('')
const isSubmitting = ref(false)

// 帖子详情弹窗
const showDetail = ref(false)
const currentPost = ref(null)
const replyContent = ref('')
const isReplying = ref(false)

onMounted(async () => {
    isLogin.value = !!localStorage.getItem('token')
    if (isLogin.value) {
        try {
            const res = await userGet('info')
            if (res.success) {
                currentUserId.value = res.data.id
            }
        } catch {}
    }
    fetchPosts()
})

// 加载帖子列表
const fetchPosts = async () => {
    if (isLoading.value) return
    isLoading.value = true
    try {
        const res = await postsGet('list', { page: 1, pageSize: 10 })
        if (res.success) {
            posts.value = res.data.list
            hasMore.value = res.data.hasMore
            page.value = 1
        }
    } catch {
        showToast('加载失败')
    } finally {
        isLoading.value = false
    }
}

// 加载更多
const loadMore = async () => {
    if (loadingMore.value || !hasMore.value) return
    loadingMore.value = true
    try {
        const res = await postsGet('list', { page: page.value + 1, pageSize: 10 })
        if (res.success) {
            posts.value.push(...res.data.list)
            hasMore.value = res.data.hasMore
            page.value++
        }
    } catch {
        showToast('加载失败')
    } finally {
        loadingMore.value = false
    }
}

// 打开发布弹窗
const openCreate = () => {
    if (!isLogin.value) {
        showToast('请先登录')
        return
    }
    newTitle.value = ''
    newContent.value = ''
    showCreate.value = true
}

// 发布帖子
const submitPost = async () => {
    if (!newTitle.value.trim()) {
        showToast('请输入标题')
        return
    }
    if (!newContent.value.trim()) {
        showToast('请输入内容')
        return
    }
    isSubmitting.value = true
    try {
        const res = await postsPost('create', { title: newTitle.value, content: newContent.value })
        if (res.success) {
            showToast('发布成功')
            showCreate.value = false
            fetchPosts()
        } else {
            showToast(res.error || '发布失败')
        }
    } catch {
        showToast('发布失败')
    } finally {
        isSubmitting.value = false
    }
}

// 打开帖子详情
const openDetail = async (post) => {
    try {
        const res = await postsGet(`detail/${post.id}`)
        if (res.success) {
            currentPost.value = res.data
            showDetail.value = true
        }
    } catch {
        showToast('加载失败')
    }
}

// 提交回复
const submitReply = async () => {
    if (!replyContent.value.trim()) {
        showToast('请输入回复内容')
        return
    }
    isReplying.value = true
    try {
        const res = await postsPost(`reply/${currentPost.value.id}`, { content: replyContent.value })
        if (res.success) {
            showToast('回复成功')
            replyContent.value = ''
            const detailRes = await postsGet(`detail/${currentPost.value.id}`)
            if (detailRes.success) {
                currentPost.value = detailRes.data
            }
        } else {
            showToast(res.error || '回复失败')
        }
    } catch {
        showToast('回复失败')
    } finally {
        isReplying.value = false
    }
}

// 删除帖子
const deletePost = async (post) => {
    try {
        await showConfirmDialog({
            title: '确认删除',
            message: `确定要删除"${post.title}"吗？`,
        })
        const res = await postsPost(`delete/${post.id}`)
        if (res.success) {
            showToast('已删除')
            showDetail.value = false
            fetchPosts()
        }
    } catch { /* 用户取消 */ }
}

// 删除回复
const deleteReply = async (reply) => {
    try {
        await showConfirmDialog({
            title: '确认删除',
            message: '确定要删除该回复吗？',
        })
        const res = await postsPost(`delete-reply/${reply.id}`)
        if (res.success) {
            showToast('已删除')
            const detailRes = await postsGet(`detail/${currentPost.value.id}`)
            if (detailRes.success) {
                currentPost.value = detailRes.data
            }
        }
    } catch { /* 用户取消 */ }
}

const formatTime = (time) => {
    const d = new Date(time)
    const now = new Date()
    const diff = now - d
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    return d.toLocaleDateString()
}

const onChange = (event) => {
    active.value = event.detail
}
</script>

<template>
    <div class="page-container">
        <div class="page-header">
            <van-nav-bar title="旅行社区">
                <template #right>
                    <van-icon name="add-o" size="22" color="#fff" @click="openCreate" style="cursor: pointer;" />
                </template>
            </van-nav-bar>
        </div>

        <div class="page-content">
            <!-- 加载中 -->
            <van-loading v-if="isLoading" size="32px" vertical style="margin-top: 80px;" color="#ff6b35">
                加载中...
            </van-loading>

            <!-- 空状态 -->
            <div v-else-if="posts.length === 0" class="empty-state">
                <span class="empty-state-icon">📝</span>
                <div style="font-size: 16px; color: #666; margin-bottom: 8px;">暂无帖子</div>
                <div style="font-size: 13px; color: #999; margin-bottom: 20px;">快来分享你的旅行经历吧</div>
                <van-button type="primary" round size="small" class="btn-gradient" @click="openCreate">
                    发布第一条帖子
                </van-button>
            </div>

            <!-- 帖子列表 -->
            <template v-else>
                <div
                    v-for="(post, index) in posts"
                    :key="post.id"
                    class="post-card card"
                    :style="{ animationDelay: `${index * 0.05}s`, animation: 'fadeInUp 0.4s ease-out backwards' }"
                    @click="openDetail(post)"
                >
                    <div class="post-card-header">
                        <div class="post-avatar" :style="{ background: getAvatarColor(index) }">
                            {{ (post.author_name || '?')[0] }}
                        </div>
                        <div class="post-meta">
                            <div class="post-card-title">{{ post.title }}</div>
                            <div class="post-card-meta-row">
                                <span class="time-text">{{ formatTime(post.created_at) }}</span>
                                <span v-if="post.reply_count > 0" class="tag">{{ post.reply_count }} 回复</span>
                            </div>
                        </div>
                    </div>
                    <div class="post-card-content">{{ post.content }}</div>
                </div>

                <!-- 加载更多 -->
                <div style="text-align: center; padding: 20px;" v-if="hasMore">
                    <van-loading v-if="loadingMore" size="20px" color="#ff6b35">加载中...</van-loading>
                    <van-button v-else size="small" plain round type="primary" @click="loadMore">
                        加载更多
                    </van-button>
                </div>
                <div v-else-if="posts.length > 0" class="time-text" style="text-align: center; padding: 16px;">
                    — 没有更多了 —
                </div>
            </template>
        </div>

        <div class="page-tabbar">
            <van-tabbar v-model="active" @change="onChange">
                <van-tabbar-item icon="home-o" to="/home">首页</van-tabbar-item>
                <van-tabbar-item icon="chat" to="/chat">聊天</van-tabbar-item>
                <van-tabbar-item icon="friends-o" to="/community">社区</van-tabbar-item>
                <van-tabbar-item icon="user-o" to="/profile">个人</van-tabbar-item>
            </van-tabbar>
        </div>

        <!-- 发布帖子弹窗 -->
        <van-popup
            v-model:show="showCreate"
            position="bottom"
            :style="{ height: '80%', borderRadius: '16px 16px 0 0' }"
            safe-area-inset-bottom
        >
            <div style="padding: 16px; height: 100%; display: flex; flex-direction: column;">
                <div class="popup-header">
                    <van-icon name="cross" size="22" @click="showCreate = false" />
                    <span class="popup-title">发布帖子</span>
                    <div style="width: 22px;"></div>
                </div>
                <van-field
                    v-model="newTitle"
                    label="标题"
                    placeholder="给你的帖子起个标题吧"
                    maxlength="50"
                    show-word-limit
                    class="rounded-field"
                />
                <van-field
                    v-model="newContent"
                    type="textarea"
                    rows="6"
                    placeholder="分享你的旅行故事..."
                    autosize
                    maxlength="500"
                    show-word-limit
                    style="flex: 1;"
                />
                <van-button
                    type="primary"
                    block
                    round
                    :loading="isSubmitting"
                    @click="submitPost"
                    class="btn-gradient"
                    style="margin-top: 16px;"
                >发布</van-button>
            </div>
        </van-popup>

        <!-- 帖子详情弹窗 -->
        <van-popup
            v-model:show="showDetail"
            position="bottom"
            :style="{ height: '85%', borderRadius: '16px 16px 0 0' }"
            safe-area-inset-bottom
        >
            <div v-if="currentPost" class="detail-container">
                <!-- 详情头部 -->
                <div class="detail-header">
                    <div class="detail-header-row">
                        <span class="detail-title">{{ currentPost.title }}</span>
                        <van-icon name="cross" size="22" @click="showDetail = false" />
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <span class="time-text">{{ formatTime(currentPost.created_at) }}</span>
                        <van-icon
                            v-if="currentPost.user_id === currentUserId"
                            name="delete-o"
                            size="18"
                            color="#ee0a24"
                            @click="deletePost(currentPost)"
                        />
                    </div>
                </div>

                <!-- 内容区域 -->
                <div class="detail-body">
                    <div class="detail-content">{{ currentPost.content }}</div>

                    <!-- 回复列表 -->
                    <div v-if="currentPost.replies && currentPost.replies.length > 0">
                        <div class="card-title" style="margin-bottom: 12px;">回复 ({{ currentPost.replies.length }})</div>
                        <div
                            v-for="reply in currentPost.replies"
                            :key="reply.id"
                            class="reply-item"
                        >
                            <div class="reply-header">
                                <span class="time-text">{{ formatTime(reply.created_at) }}</span>
                                <van-icon
                                    v-if="reply.user_id === currentUserId"
                                    name="delete-o"
                                    size="14"
                                    color="#999"
                                    @click="deleteReply(reply)"
                                />
                            </div>
                            <div class="reply-content">{{ reply.content }}</div>
                        </div>
                    </div>
                    <div v-else class="empty-state" style="padding: 40px 20px;">
                        <span class="empty-state-icon">💬</span>
                        <div style="font-size: 14px; color: #999;">暂无回复，来说点什么吧</div>
                    </div>
                </div>

                <!-- 底部回复栏 -->
                <div class="reply-bar">
                    <van-field
                        v-model="replyContent"
                        placeholder="写回复..."
                        :border="false"
                        class="reply-input"
                    />
                    <van-button 
                        size="small" 
                        round 
                        :loading="isReplying" 
                        @click="submitReply"
                        class="send-btn"
                    >发送</van-button>
                </div>
            </div>
        </van-popup>
    </div>
</template>

<style scoped>
/* 帖子卡片 */
.post-card {
    padding: 14px;
    margin-bottom: 10px;
    cursor: pointer;
    animation: fadeInUp 0.4s ease-out backwards;
}

.post-card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
}

.post-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 700;
    font-size: 16px;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.post-meta {
    flex: 1;
    min-width: 0;
}

.post-card-title {
    font-size: 16px;
    font-weight: 700;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 4px;
}

.post-card-meta-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.post-card-content {
    font-size: 14px;
    color: #666;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
    padding-left: 50px;
}

/* 弹窗头部 */
.popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.popup-title {
    font-size: 18px;
    font-weight: 700;
    color: #333;
}

/* 详情面板 */
.detail-container {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.detail-header {
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
    flex-shrink: 0;
}

.detail-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.detail-title {
    font-size: 18px;
    font-weight: 700;
    color: #333;
}

.detail-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
}

.detail-content {
    line-height: 1.8;
    white-space: pre-wrap;
    font-size: 15px;
    color: #333;
    margin-bottom: 24px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 12px;
}

/* 回复项 */
.reply-item {
    padding: 12px;
    background: #f8f9fa;
    border-radius: 10px;
    margin-bottom: 8px;
}

.reply-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
}

.reply-content {
    font-size: 14px;
    line-height: 1.6;
    color: #444;
}

/* 回复栏 */
.reply-bar {
    padding: 10px 16px;
    border-top: 1px solid #f0f0f0;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    background: #fff;
}

.reply-input {
    background: #f0f2f5;
    border-radius: 20px;
    padding: 0 12px;
    flex: 1;
}

.reply-input :deep(.van-field__control) {
    font-size: 14px;
}

.send-btn {
    background: linear-gradient(135deg, #ff6b35, #f7931e) !important;
    border: none !important;
    color: #fff !important;
    font-weight: 600;
}
</style>
