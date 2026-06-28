<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { userPost, userGet } from '../utils/request'
import { planGet, planDelete } from '../utils/request'

const active = ref(2)
const router = useRouter()
const email = ref('')
const sms = ref('')
const nickname = ref('')
const isLogin = ref(false)
const cooldown = ref(0)
const savedPlans = ref([])
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
        } catch {
            
        }
    }, 600)
}

const onTouchEnd = () => {
    clearTimeout(longPressTimer)
}

const onChange = (event) => {
  active.value = event.detail
}

//检查本地token
onMounted(async () => {
    const token = localStorage.getItem('token')
    if (!token) return

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
        } else {
            localStorage.removeItem('token')
            localStorage.removeItem('nickname')
        }
    } catch (err) {
        isLogin.value = true
        nickname.value = localStorage.getItem('nickname') || ''
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
    showToast('已退出登录')
}

</script>

<template>
    <div class="page-container">
        <div class="page-header">
            <van-nav-bar left-arrow="true" left-text="返回" @click-left="goBack" title="个人" />
        </div>
        <div class="page-content" style="padding: 10px;">
            <div v-if="!isLogin" class="login-container">
                <van-cell-group style="padding: 10px;">
                    <van-cell @click="showToast('/login')" title="请使用邮箱登录或注册"/>
                    <van-field v-model="email" label="邮箱" placeholder="请输入邮箱" />
                        <van-field
                            v-model="sms"
                            center
                            clearable
                            label="验证码"
                            placeholder="请输入验证码"
                        >
                            <template #button>
                            <van-button size="small" type="primary" @click="sendSms" :disabled="cooldown > 0">
                                {{ cooldown > 0 ? cooldown + 's' : '发送验证码' }}
                            </van-button>
                            </template>
                    </van-field>
                    <van-button style="width: 90%; margin: 0 auto; display: block;" type="primary" @click="login">登录/注册</van-button>
                </van-cell-group>
            </div>
            <div v-if="isLogin" class="user-info" style="margin-top: 10px;">
                <van-cell-group>
                    <van-cell title="用户信息" />
                    <van-cell title="邮箱" :value="nickname || '未设置'" />
                </van-cell-group>
            </div>
            <div v-if="isLogin" class="saved-plans" style="margin-top: 10px;">
                <van-cell-group>
                    <van-cell title="已保存的规划方案" />
                    <van-cell 
                        v-for="plan in savedPlans" 
                        :key="plan.id" 
                        :title="`${plan.destination} · ${plan.days}日游`" 
                        :label="`预算：${plan.budget}  |  ${new Date(plan.createdAt).toLocaleDateString()}`"
                        is-link 
                        arrow-direction="right"
                        @click="router.push({ name: 'detail', query: { planId: plan.id } })"
                        @touchstart="onTouchStart(plan)"
                        @touchend="onTouchEnd"
                        @touchmove="onTouchEnd"
                        @touchcancel="onTouchEnd"
                    />
                    <van-cell v-if="savedPlans.length === 0" title="暂无保存的方案" />
                </van-cell-group>
                <van-button 
                    style="width: 90%; margin: 20px auto; display: block;" 
                    type="danger" 
                    @click="logout"
                >退出登录</van-button>
            </div>
        </div>
        <div class="page-tabbar">
            <van-tabbar v-model="active" @change="onChange">
                <van-tabbar-item icon="home-o" to="/home">首页</van-tabbar-item>
                <van-tabbar-item icon="chat" to="/chat">聊天</van-tabbar-item>
                <van-tabbar-item icon="user" to="/profile">个人</van-tabbar-item>
            </van-tabbar>
        </div>
    </div>
</template>
