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

    // 提取最近 10 轮对话历史（20 条消息）
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
    // 获取响应式代理引用，确保视图更新
    const idx = messages.value.length - 1
    scrollToBottom()

    fetchStream('chat', { message: query, history: history }, (line) => {
        if (line.startsWith('event:') || line.startsWith(':')) return
        if (line.startsWith('data:')) {
            const jsonStr = line.slice(5).trim()
            try {
                const parsed = JSON.parse(jsonStr)
                if (parsed.done) return
                const content = parsed.content || parsed.message || ''
                if (content) messages.value[idx].content += content
            } catch {
                messages.value[idx].content += jsonStr
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
            <van-nav-bar title="聊天" :left-arrow="true" left-text="返回" @click-left="goBack" right-text="重置聊天" @click-right="resetChat" />
        </div>
        <div class="chat-body">
            <div v-if="messages.length === 0"  class="chat-container">
                <van-empty description="和AI聊天吧" style="margin-top: 120px;" />
                <div class="chat-problems" style="margin-top: 20px;">
                    <div class="chat-problems-title" style="text-align: center;">常见问题</div>
                    <van-tag @click="handleClick(q)"  v-for="q in quickQuestions" :key="q" size="medium" type="primary" mark="tag" style="margin: 10px;">
                        {{ q }}
                    </van-tag>
                </div>
            </div>
            <div v-else class="message-list">
                <div
                    v-for="msg in messages"
                    :key="msg.id"
                    :class="['msg-row', msg.role === 'user' ? 'msg-row--right' : 'msg-row--left']"
                >
                    <div v-if="msg.role === 'assistant'" class="msg-avatar msg-avatar--ai">AI</div>

                    <div class="msg-bubble-wrapper">
                        <div
                            :class="['msg-bubble', msg.role === 'user' ? 'msg-bubble--user' : 'msg-bubble--ai']"
                        >
                            <div class="msg-text">{{ msg.content }}</div>
                        </div>
                    </div>

                    <div v-if="msg.role === 'user'" class="msg-avatar msg-avatar--user">我</div>
                </div>

                <div v-if="isStreaming" class="typing-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
        </div>
        <div class="chat-input">
           <van-field
                type="text"
                v-model="inputMessage"
                placeholder="请输入问题"
           >
                <template #button>
                    <van-button @click="sendMessage" :disabled="!inputMessage.trim()" type="primary" size="small">发送</van-button>
                </template>
            </van-field>
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
}

.chat-input {
    flex-shrink: 0;
}

.message-list {
    padding: 12px 10px;
}

.msg-row {
    display: flex;
    align-items: flex-start;
    margin-bottom: 16px;
}

.msg-row--left {
    flex-direction: row;
}

.msg-row--right {
    flex-direction: row;
    justify-content: flex-end;
}

.msg-avatar {
    width: 38px;
    height: 38px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
    color: #fff;
    flex-shrink: 0;
    margin: 0 8px;
}

.msg-avatar--ai {
    background: #07c160;
}

.msg-avatar--user {
    background: #1989fa;
}

.msg-bubble-wrapper {
    max-width: 70%;
}

.msg-bubble {
    padding: 10px 13px;
    border-radius: 6px;
    position: relative;
    word-break: break-word;
}

.msg-bubble--user {
    background: #95ec69;
    color: #000;
}

.msg-bubble--ai {
    background: #fff;
    color: #333;
}

.msg-text {
    font-size: 15px;
    line-height: 1.55;
    white-space: pre-wrap;
}

.typing-dots {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 16px;
}

.typing-dots span {
    width: 7px;
    height: 7px;
    background: #999;
    border-radius: 50%;
    animation: dotBounce 1.4s infinite ease-in-out both;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }
.typing-dots span:nth-child(3) { animation-delay: 0s; }

@keyframes dotBounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
}
</style>
