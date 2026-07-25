<script setup>
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { fetchStream } from '../utils/request'
import { showToast } from 'vant'

const router = useRouter()

const active = ref(1)
const messages = ref([])
const inputMessage = ref('')
const isStreaming = ref(false)

const quickQuestions = ref(['上海有哪些景点', '广州有什么特色美食', '北京三天旅游规划'])

const goBack = () => {
    router.back()
}

const onChange = (event) => {
    active.value = event.detail
}

const scrollToBottom = async () => {
    await nextTick()
    const el = document.querySelector('.chat-body')
    if (el) el.scrollTop = el.scrollHeight
}

const handleClick = (q) => {
    inputMessage.value = q
    sendMessage()
}

const resetChat = () => {
    messages.value = []
    active.value = 1
    inputMessage.value = ''
}

const sendMessage = () => {
    const msg = inputMessage.value.trim()
    if (!msg || isStreaming.value) return

    const history = messages.value.slice(-20).map(m => ({
        role: m.role,
        content: m.content
    }))

    messages.value.push({
        id: Date.now(),
        role: 'user',
        content: msg,
    })
    inputMessage.value = ''
    scrollToBottom()

    fetchAIResponse(msg, history)
}

const fetchAIResponse = (query, history = []) => {
    isStreaming.value = true

    messages.value.push({
        id: Date.now() + 1,
        role: 'assistant',
        content: '',
    })
    const idx = messages.value.length - 1
    scrollToBottom()

    fetchStream('chat', { message: query, history: history }, (line) => {
        if (line.startsWith('event:') || line.startsWith(':')) return
        if (line.startsWith('data:')) {
            const jsonStr = line.slice(5).trim()
            try {
                const parsed = JSON.parse(jsonStr)
                if (parsed.done || parsed.type === 'complete') return
                const content = parsed.content || parsed.message || ''
                if (content) messages.value[idx].content += content
            } catch {
                console.error('JSON 解析失败')
            }
            scrollToBottom()
        }
    }, () => {
        isStreaming.value = false
        if (!messages.value[idx].content) messages.value[idx].content = '(AI 未返回内容)'
        scrollToBottom()
    }, (errMsg) => {
        isStreaming.value = false
        messages.value[idx].content = 'AI 发生错误：' + errMsg
        showToast('AI 发生错误，请稍后重试')
    })
}
</script>

<template>
    <div class="page-container chat-page">
        <div class="page-header">
            <van-nav-bar 
                title="AI 旅行助手" 
                :left-arrow="true" 
                left-text="返回" 
                @click-left="goBack" 
            >
                <template #right>
                    <van-icon name="replay" size="20" color="#fff" @click="resetChat" style="cursor: pointer;" />
                </template>
            </van-nav-bar>
        </div>

        <div class="chat-body">
            <!-- 空状态 -->
            <div v-if="messages.length === 0" class="chat-welcome">
                <div class="welcome-icon">
                    <span class="welcome-emoji">✈️</span>
                </div>
                <div class="welcome-title">AI 旅行助手</div>
                <div class="welcome-desc">问我任何关于旅行的问题，我会为您解答</div>
                
                <div class="quick-questions">
                    <div 
                        v-for="q in quickQuestions" 
                        :key="q"
                        class="quick-tag"
                        @click="handleClick(q)"
                    >
                        {{ q }}
                    </div>
                </div>
            </div>

            <!-- 消息列表 -->
            <div v-else class="message-list">
                <div
                    v-for="msg in messages"
                    :key="msg.id"
                    :class="['msg-row', msg.role === 'user' ? 'msg-row--right' : 'msg-row--left']"
                >
                    <div v-if="msg.role === 'assistant'" class="msg-avatar msg-avatar--ai">
                        <span class="avatar-text">AI</span>
                    </div>

                    <div class="msg-bubble-wrapper">
                        <div
                            :class="['msg-bubble', msg.role === 'user' ? 'msg-bubble--user' : 'msg-bubble--ai']"
                        >
                            <div class="msg-text">{{ msg.content }}</div>
                        </div>
                    </div>

                    <div v-if="msg.role === 'user'" class="msg-avatar msg-avatar--user">
                        <span class="avatar-text">我</span>
                    </div>
                </div>

                <div v-if="isStreaming" class="typing-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
        </div>
        
        <div class="chat-bottom">
            <div class="chat-input-bar">
                <van-field
                    v-model="inputMessage"
                    type="text"
                    placeholder="输入您的问题..."
                    :border="false"
                    class="chat-field"
                >
                    <template #button>
                        <van-button 
                            @click="sendMessage" 
                            :disabled="!inputMessage.trim()" 
                            type="primary" 
                            size="small" 
                            round
                            class="send-btn"
                        >发送</van-button>
                    </template>
                </van-field>
            </div>

            <van-tabbar v-model="active" @change="onChange" style="position: static;">
                <van-tabbar-item icon="home-o" to="/home">首页</van-tabbar-item>
                <van-tabbar-item icon="chat" to="/chat">聊天</van-tabbar-item>
                <van-tabbar-item icon="friends-o" to="/community">社区</van-tabbar-item>
                <van-tabbar-item icon="user-o" to="/profile">个人</van-tabbar-item>
            </van-tabbar>
        </div>
    </div>
</template>

<style scoped>
.chat-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
}

.chat-body {
    flex: 1;
    overflow-y: auto;
    background: #f0f2f5;
}

/* 欢迎区域 */
.chat-welcome {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 60px 30px;
    animation: fadeInUp 0.5s ease-out;
}

.welcome-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ff6b35, #f7931e);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 25px rgba(255, 107, 53, 0.3);
    margin-bottom: 20px;
}

.welcome-emoji {
    font-size: 36px;
}

.welcome-title {
    font-size: 24px;
    font-weight: 700;
    color: #333;
    margin-bottom: 8px;
}

.welcome-desc {
    font-size: 15px;
    color: #999;
    margin-bottom: 30px;
}

.quick-questions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    width: 100%;
}

.quick-tag {
    padding: 10px 18px;
    background: #fff;
    border-radius: 20px;
    font-size: 14px;
    color: #ff6b35;
    border: 1px solid rgba(255, 107, 53, 0.2);
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.quick-tag:active {
    background: linear-gradient(135deg, #ff6b35, #f7931e);
    color: #fff;
    transform: scale(0.95);
    border-color: transparent;
}

/* 消息列表 */
.message-list {
    padding: 12px 10px;
}

.msg-row {
    display: flex;
    align-items: flex-start;
    margin-bottom: 16px;
    animation: fadeInUp 0.3s ease-out;
}

.msg-row--left {
    flex-direction: row;
}

.msg-row--right {
    flex-direction: row;
    justify-content: flex-end;
}

.msg-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin: 0 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.msg-avatar--ai {
    background: linear-gradient(135deg, #ff6b35, #f7931e);
}

.msg-avatar--user {
    background: linear-gradient(135deg, #667eea, #764ba2);
}

.avatar-text {
    font-size: 11px;
    font-weight: 700;
    color: #fff;
}

.msg-bubble-wrapper {
    max-width: 70%;
}

.msg-bubble {
    padding: 12px 14px;
    border-radius: 16px;
    position: relative;
    word-break: break-word;
}

.msg-bubble--user {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: #fff;
    border-bottom-right-radius: 4px;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.25);
}

.msg-bubble--ai {
    background: #fff;
    color: #333;
    border-bottom-left-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.msg-text {
    font-size: 15px;
    line-height: 1.6;
    white-space: pre-wrap;
}

/* 输入栏 */
.chat-bottom {
    flex-shrink: 0;
    background: #fff;
}

.chat-input-bar {
    padding: 8px 12px;
    background: #fff;
    border-top: 1px solid #eee;
}

.chat-field {
    background: #f0f2f5;
    border-radius: 24px;
    padding: 4px 12px;
}

.chat-field :deep(.van-field__control) {
    font-size: 15px;
}

.send-btn {
    background: linear-gradient(135deg, #ff6b35, #f7931e) !important;
    border: none !important;
    font-weight: 600;
}

/* 打字动画 */
.typing-dots {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 8px 20px;
}

.typing-dots span {
    width: 8px;
    height: 8px;
    background: linear-gradient(135deg, #ff6b35, #f7931e);
    border-radius: 50%;
    animation: dotBounce 1.4s infinite ease-in-out both;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }
.typing-dots span:nth-child(3) { animation-delay: 0s; }

@keyframes dotBounce {
    0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
    40% { transform: scale(1); opacity: 1; }
}
</style>
