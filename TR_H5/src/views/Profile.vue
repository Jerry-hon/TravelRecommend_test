<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { userPost, userGet } from '../utils/request'
import { planGet, planDelete } from '../utils/request'
import { postsGet } from '../utils/request'

const active = ref(3)
const router = useRouter()
const email = ref('')
const sms = ref('')
const nickname = ref('')
const isLogin = ref(false)
const cooldown = ref(0)
const savedPlans = ref([])
const myPosts = ref([])
let smsTimer = null
let longPressTimer = null

const goBack = () => {
    router.back()
}

const onTouchStart = (plan) => {
    longPressTimer = setTimeout(async () => {
        try {
            await showConfirmDialog({
                title: '确认删除',
                message: `是否删除「${plan.destination} · ${plan.days}日游」？`,
                confirmButtonText: '删除',
                confirmButtonColor: '#ee0a24',
            })
            const res = await planDelete(plan.id)
            if (res.success) {
                savedPlans.value = savedPlans.value.filter(p => p.id !== plan.id)
                showToast('已删除')
            }
        } catch {}
    }, 600)
}

const onTouchEnd = () => {
    clearTimeout(longPressTimer)
}

const onChange = (event) => {
    active.value = event.detail
}

onMounted(async () => {
    const savedToken = localStorage.getItem('token')
    if (!savedToken) return

    try {
        const res = await userGet('info')
        if (res.success) {
            isLogin.value = true
            nickname.value = res.data.nickname || res.data.email
            localStorage.setItem('nickname', nickname.value)

            try {
                const plansRes = await planGet('list')
                if (plansRes.success) {
                    savedPlans.value = plansRes.data
                }
            } catch {}

            try {
                const postsRes = await postsGet('my')
                if (postsRes.success) {
                    myPosts.value = postsRes.data
                }
            } catch {}
        } else {
            localStorage.removeItem('token')
            localStorage.removeItem('nickname')
        }
    } catch (err) {
        localStorage.removeItem('token')
        localStorage.removeItem('nickname')
    }
})

const isEmailValid = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)

const sendSms = async () => {
    if (!email.value) {
        showToast('请输入邮箱')
        return
    }
    if (!isEmailValid(email.value)) {
        showToast('邮箱格式不正确')
        return
    }
    try {
        await userPost('send-code', { email: email.value })
        showToast('验证码已发送')

        cooldown.value = 60
        smsTimer = setInterval(() => {
            cooldown.value--
            if (cooldown.value <= 0) {
                clearInterval(smsTimer)
                smsTimer = null
            }
        }, 1000)
    } catch (err) {
        showToast('发送失败，请稍后重试')
    }
}

const login = async () => {
    if (!email.value) {
        showToast('请输入邮箱')
        return
    }
    if (!isEmailValid(email.value)) {
        showToast('邮箱格式不正确')
        return
    }
    if (!sms.value) {
        showToast('请输入验证码')
        return
    }
    try {
        const res = await userPost('login', { email: email.value, code: sms.value })
        if (res.success) {
            localStorage.setItem('token', res.data.token)
            localStorage.setItem('nickname', res.data.nickname || email.value)
            isLogin.value = true
            nickname.value = res.data.nickname || email.value
            showToast('登录成功')
        } else {
            showToast(res.error || '登录失败')
        }
    } catch (err) {
        showToast('登录失败，请稍后重试')
    }
}

const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('nickname')
    isLogin.value = false
    email.value = ''
    sms.value = ''
    nickname.value = ''
    savedPlans.value = []
    myPosts.value = []
    showToast('已退出登录')
}
</script>

<template>
    <div class="page-container">
        <div class="page-header">
            <van-nav-bar title="个人中心" />
        </div>

        <div class="page-content">
            <div v-if="!isLogin">
                <div class="welcome-card">
                    <div class="welcome-avatar">🧳</div>
                    <div class="welcome-text">登录后体验完整功能</div>
                    <div class="welcome-sub">保存行程 · 发帖互动 · 收藏攻略</div>
                </div>

                <div class="card">
                    <van-field 
                        v-model="email" 
                        label="邮箱" 
                        placeholder="请输入邮箱"
                        left-icon="envelop-o"
                        class="rounded-field"
                    />
                    <van-field
                        v-model="sms"
                        center
                        clearable
                        label="验证码"
                        placeholder="请输入验证码"
                        left-icon="shield-o"
                    >
                        <template #button>
                            <van-button 
                                size="small" 
                                type="primary" 
                                round
                                @click="sendSms" 
                                :disabled="cooldown > 0"
                            >
                                {{ cooldown > 0 ? cooldown + 's' : '发送验证码' }}
                            </van-button>
                        </template>
                    </van-field>

                    <van-button 
                        type="primary" 
                        block 
                        round
                        class="btn-gradient"
                        style="margin-top: 16px;"
                        @click="login"
                    >登录 / 注册</van-button>
                </div>
            </div>

            <div v-if="isLogin">
                <div class="user-card">
                    <div class="user-avatar">
                        {{ (nickname || '?')[0].toUpperCase() }}
                    </div>
                    <div class="user-info-right">
                        <div class="user-name">{{ nickname || '未设置' }}</div>
                        <div class="user-email">{{ email || '' }}</div>
                    </div>
                    <van-icon name="setting-o" size="22" color="#999" />
                </div>

                <div class="card">
                    <div class="card-title">已保存的规划方案</div>
                    <div
                        v-for="plan in savedPlans"
                        :key="plan.id"
                        class="plan-item"
                        @click="router.push({ name: 'detail', query: { planId: plan.id } })"
                        @touchstart="onTouchStart(plan)"
                        @touchend="onTouchEnd"
                        @touchmove="onTouchEnd"
                        @touchcancel="onTouchEnd"
                    >
                        <div class="plan-dest">{{ plan.destination }} · {{ plan.days }}日游</div>
                        <div class="plan-meta">
                            <span class="tag">预算 {{ plan.budget }}</span>
                            <span class="time-text">{{ new Date(plan.createdAt).toLocaleDateString() }}</span>
                        </div>
                        <van-icon name="arrow" size="16" color="#ccc" style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%);" />
                    </div>
                    <div v-if="savedPlans.length === 0" class="time-text" style="text-align: center; padding: 20px 0;">
                        暂无保存的方案
                    </div>
                </div>

                <div class="card">
                    <div class="card-title">我的发帖记录</div>
                    <div
                        v-for="post in myPosts"
                        :key="post.id"
                        class="post-record"
                    >
                        <div class="post-record-title">{{ post.title }}</div>
                        <div class="post-record-content">{{ post.content.length > 40 ? post.content.slice(0, 40) + '...' : post.content }}</div>
                    </div>
                    <div v-if="myPosts.length === 0" class="time-text" style="text-align: center; padding: 20px 0;">
                        暂无发帖记录
                    </div>
                </div>

                <van-button 
                    type="danger" 
                    block 
                    round
                    style="margin-top: 20px; box-shadow: 0 4px 15px rgba(238, 10, 36, 0.15);"
                    @click="logout"
                >退出登录</van-button>
            </div>
        </div>

        <div class="page-tabbar">
            <van-tabbar v-model="active" @change="onChange">
                <van-tabbar-item icon="home-o" to="/home">首页</van-tabbar-item>
                <van-tabbar-item icon="chat" to="/chat">聊天</van-tabbar-item>
                <van-tabbar-item icon="friends-o" to="/community">社区</van-tabbar-item>
                <van-tabbar-item icon="user-o" to="/profile">个人</van-tabbar-item>
            </van-tabbar>
        </div>
    </div>
</template>

<style scoped>
.welcome-card {
    background: var(--travel-gradient);
    border-radius: 16px;
    padding: 30px 20px;
    text-align: center;
    color: #fff;
    margin-bottom: 16px;
    box-shadow: 0 8px 25px rgba(255, 107, 53, 0.25);
}

.welcome-avatar {
    font-size: 48px;
    margin-bottom: 12px;
}

.welcome-text {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 6px;
}

.welcome-sub {
    font-size: 13px;
    opacity: 0.85;
}

.user-card {
    display: flex;
    align-items: center;
    gap: 14px;
    background: #fff;
    border-radius: 16px;
    padding: 20px 16px;
    margin-bottom: 16px;
    box-shadow: var(--card-shadow);
}

.user-avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--travel-gradient);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 24px;
    font-weight: 700;
    box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
}

.user-info-right {
    flex: 1;
}

.user-name {
    font-size: 18px;
    font-weight: 700;
    color: #333;
    margin-bottom: 4px;
}

.user-email {
    font-size: 13px;
    color: #999;
}

.plan-item {
    position: relative;
    padding: 14px 40px 14px 0;
    border-bottom: 1px solid #f5f5f5;
    cursor: pointer;
    transition: background 0.2s;
}

.plan-item:last-child {
    border-bottom: none;
}

.plan-item:active {
    background: #f8f9fa;
}

.plan-dest {
    font-size: 15px;
    font-weight: 600;
    color: #333;
    margin-bottom: 6px;
}

.plan-meta {
    display: flex;
    align-items: center;
    gap: 8px;
}

.post-record {
    padding: 12px 0;
    border-bottom: 1px solid #f5f5f5;
}

.post-record:last-child {
    border-bottom: none;
}

.post-record-title {
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
}

.post-record-content {
    font-size: 12px;
    color: #999;
    line-height: 1.5;
}
</style>
