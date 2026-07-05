<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { postsGet, postsPost } from '../utils/request'
import { userGet } from '../utils/request'

const router = useRouter()

const active = ref(2)
const isLoading = ref(false)
const isLogin = ref(false)
const currentUserId = ref(null)

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
            // 刷新详情
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
    const d = new Date(time.replace(' ', 'T') + 'Z')
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
            <van-nav-bar title="社区" right-text="发布" @click-right="openCreate" />
        </div>
        <div class="page-content" style="padding: 10px; flex: 1; overflow-y: auto; padding-bottom: 60px;">
            <!-- 加载中 -->
            <van-loading v-if="isLoading" size="32px" vertical style="margin-top: 80px;">加载中...</van-loading>

            <!-- 空状态 -->
            <van-empty v-else-if="posts.length === 0" description="暂无帖子，快来发布第一条吧" />

            <!-- 帖子列表 -->
            <template v-else>
                <div
                    v-for="post in posts"
                    :key="post.id"
                    class="post-card"
                    @click="openDetail(post)"
                >
                    <div class="post-card-title">{{ post.title }}</div>
                    <div class="post-card-content">{{ post.content }}</div>
                    <div class="post-card-time">{{ formatTime(post.created_at) }}</div>
                </div>

                <!-- 加载更多 -->
                <div style="text-align: center; padding: 16px;" v-if="hasMore" @click="loadMore">
                    <van-loading v-if="loadingMore" size="20px">加载中...</van-loading>
                    <van-button v-else size="small" plain type="primary">加载更多</van-button>
                </div>
                <div style="text-align: center; padding: 16px; color: #999; font-size: 13px;" v-else-if="posts.length > 0">
                    没有更多了
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
            style="height: 80%; border-radius: 16px 16px 0 0;"
        >
            <div style="padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <span style="font-size: 18px; font-weight: bold;">发布帖子</span>
                    <van-icon name="cross" size="20" @click="showCreate = false" />
                </div>
                <van-field
                    v-model="newTitle"
                    label="标题"
                    placeholder="请输入标题"
                    style="margin-bottom: 10px;"
                />
                <van-field
                    v-model="newContent"
                    type="textarea"
                    rows="6"
                    placeholder="说点什么吧..."
                    autosize
                />
                <van-button
                    type="primary"
                    block
                    round
                    :loading="isSubmitting"
                    @click="submitPost"
                    style="margin-top: 20px;"
                >发布</van-button>
            </div>
        </van-popup>

        <!-- 帖子详情弹窗 -->
        <van-popup
            v-model:show="showDetail"
            position="bottom"
            style="height: 85%; border-radius: 16px 16px 0 0; display: flex; flex-direction: column;"
        >
            <div v-if="currentPost" style="display: flex; flex-direction: column; height: 100%;">
                <!-- 详情头部 -->
                <div style="padding: 16px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 18px; font-weight: bold;">{{ currentPost.title }}</span>
                        <van-icon name="cross" size="20" @click="showDetail = false" />
                    </div>
                    <div style="color: #999; font-size: 12px;">{{ formatTime(currentPost.created_at) }}</div>
                </div>

                <!-- 内容区域（可滚动） -->
                <div style="flex: 1; overflow-y: auto; padding: 16px;">
                    <div style="line-height: 1.8; white-space: pre-wrap; margin-bottom: 20px;">{{ currentPost.content }}</div>

                    <!-- 回复列表 -->
                    <div v-if="currentPost.replies && currentPost.replies.length > 0">
                        <div style="font-size: 15px; font-weight: bold; margin-bottom: 12px;">回复 ({{ currentPost.replies.length }})</div>
                        <div
                            v-for="reply in currentPost.replies"
                            :key="reply.id"
                            style="padding: 12px; background: #f7f8fa; border-radius: 8px; margin-bottom: 8px;"
                        >
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <span style="color: #999; font-size: 12px;">{{ formatTime(reply.created_at) }}</span>
                                <van-icon
                                    v-if="reply.user_id === currentUserId"
                                    name="delete-o"
                                    size="16"
                                    color="#999"
                                    @click="deleteReply(reply)"
                                />
                            </div>
                            <div style="line-height: 1.6;">{{ reply.content }}</div>
                        </div>
                    </div>
                    <div v-else style="text-align: center; color: #999; padding: 30px 0;">暂无回复</div>
                </div>

                <!-- 底部操作栏 -->
                <div style="padding: 10px 16px; border-top: 1px solid #f0f0f0; flex-shrink: 0; display: flex; align-items: center; gap: 10px;">
                    <van-field
                        v-model="replyContent"
                        placeholder="写回复..."
                        style="flex: 1; background: #f7f8fa; border-radius: 20px; padding: 0 12px;"
                        :border="false"
                    />
                    <van-button size="small" type="primary" round :loading="isReplying" @click="submitReply">发送</van-button>
                </div>
            </div>
        </van-popup>
    </div>
</template>

<style scoped>
.page-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

.post-card {
    background: #fff;
    padding: 14px;
    border-radius: 10px;
    margin-bottom: 10px;
}

.post-card-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.post-card-content {
    font-size: 14px;
    color: #666;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
    margin-bottom: 8px;
}

.post-card-time {
    font-size: 12px;
    color: #999;
}
</style>
