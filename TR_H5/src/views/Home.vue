<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()

const formData = reactive({
    destination: '',
    budget: null,
    days: null
})

const isLogin = ref(false)

onMounted(async () => {
    isLogin.value = localStorage.getItem('token') !== null
    if(!isLogin.value) {
        await nextTick()
        showToast('请登录后使用完整功能')
    }
})

const showDestination = ref(false)

const destinationColumns = ref([
    { text: '北京', value: '北京' },
    { text: '上海', value: '上海' },
    { text: '广州', value: '广州' },
    { text: '深圳', value: '深圳' },
    { text: '成都', value: '成都' },
    { text: '西安', value: '西安' },
    { text: '杭州', value: '杭州' },
    { text: '南京', value: '南京' },
    { text: '重庆', value: '重庆' },
    { text: '武汉', value: '武汉' },
    { text: '长沙', value: '长沙' },
    { text: '厦门', value: '厦门' },
    { text: '苏州', value: '苏州' },
    { text: '三亚', value: '三亚' },
    { text: '拉萨', value: '拉萨' },
    { text: '昆明', value: '昆明' },
    { text: '丽江', value: '丽江' },
    { text: '青岛', value: '青岛' },
])

const popularDestinations = ref([
    { text: '北京', value: '北京' },
    { text: '上海', value: '上海' },
    { text: '广州', value: '广州' },
    { text: '成都', value: '成都' },
    { text: '西安', value: '西安' },
    { text: '杭州', value: '杭州' },
])

const onConfirm = ({ selectedValues }) => {
    formData.destination = selectedValues[0]
    showDestination.value = false
}

const onCancel = () => {
    showDestination.value = false
}

const active = ref(0)
const isLoading = ref(false)

const onSubmit = async () => {
    if(!formData.destination || !formData.budget || !formData.days) {
        showToast('请填写完整信息')
        return
    }
    if(formData.budget <= 100) {
        showToast('请输入正确的预算')
        return
    }
    if(formData.days <= 0 || formData.days > 30) {
        showToast('请输入正确的天数，1-30天之间')
        return
    }
    
    isLoading.value = true
    setTimeout(() => {
        isLoading.value = false
    }, 2000)

    router.push({ name: 'detail', query: {
        destination: formData.destination,
        budget: formData.budget,
        days: formData.days
    }})
}

const onChange = (event) => {
    active.value = event.detail
}

const getDestGradient = (dest) => {
    const map = {
        '北京': 'linear-gradient(135deg, #e74c3c, #c0392b)',
        '上海': 'linear-gradient(135deg, #3498db, #2980b9)',
        '广州': 'linear-gradient(135deg, #2ecc71, #27ae60)',
        '深圳': 'linear-gradient(135deg, #1abc9c, #16a085)',
        '成都': 'linear-gradient(135deg, #f39c12, #e67e22)',
        '西安': 'linear-gradient(135deg, #9b59b6, #8e44ad)',
        '杭州': 'linear-gradient(135deg, #2ecc71, #1abc9c)',
        '南京': 'linear-gradient(135deg, #e74c3c, #c0392b)',
        '重庆': 'linear-gradient(135deg, #e74c3c, #f39c12)',
        '武汉': 'linear-gradient(135deg, #3498db, #9b59b6)',
        '长沙': 'linear-gradient(135deg, #f39c12, #e74c3c)',
        '厦门': 'linear-gradient(135deg, #3498db, #2ecc71)',
        '苏州': 'linear-gradient(135deg, #1abc9c, #27ae60)',
        '三亚': 'linear-gradient(135deg, #3498db, #1abc9c)',
        '拉萨': 'linear-gradient(135deg, #667eea, #764ba2)',
        '昆明': 'linear-gradient(135deg, #2ecc71, #f39c12)',
        '丽江': 'linear-gradient(135deg, #9b59b6, #667eea)',
        '青岛': 'linear-gradient(135deg, #3498db, #2980b9)',
    }
    return map[dest] || 'linear-gradient(135deg, #ff6b35, #f7931e)'
}
</script>

<template>
    <div class="page-container">
        <div class="page-header">
            <van-nav-bar title="首页" />
        </div>

        <div class="page-content">
            <van-notice-bar
                left-icon="info-o"
                text="项目展示"
                background="#fff3e0"
                color="#e65100"
            />

            <div class="card" style="margin-top: 10px;">
                <div class="card-title">旅程规划</div>

                <van-field
                    @click="showDestination = true"
                    v-model="formData.destination"
                    is-link
                    readonly
                    label="目的地"
                    placeholder="选择目的地"
                    class="rounded-field"
                    left-icon="location-o"
                />

                <van-field
                    v-model="formData.budget"
                    type="number"
                    label="预算"
                    placeholder="输入预算（元）"
                    class="rounded-field"
                    left-icon="gold-coin-o"
                />

                <van-field
                    v-model="formData.days"
                    type="digit"
                    label="天数"
                    placeholder="输入天数"
                    class="rounded-field"
                    left-icon="calendar-o"
                />

                <van-button
                    @click="onSubmit"
                    type="primary"
                    block
                    round
                    :loading="isLoading"
                    class="btn-gradient"
                    style="margin-top: 16px;"
                >
                    开始规划行程
                </van-button>
            </div>

            <div class="card">
                <div class="card-title">热门目的地</div>
                <div class="dest-grid">
                    <div 
                        v-for="item in popularDestinations" 
                        :key="item.value"
                        class="dest-item"
                        :style="{ background: getDestGradient(item.value) }"
                        @click="formData.destination = item.value"
                    >
                        <span class="dest-name">{{ item.value }}</span>
                    </div>
                </div>
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

        <van-popup
            v-model:show="showDestination"
            position="bottom"
            :style="{ height: '50%', borderRadius: '16px 16px 0 0' }"
            safe-area-inset-bottom
        >
            <van-picker
                :columns="destinationColumns"
                @confirm="onConfirm"
                @cancel="onCancel"
                title="选择目的地"
            />
        </van-popup>
    </div>
</template>

<style scoped>
.dest-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
}

.dest-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 18px 8px;
    border-radius: 12px;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dest-item:active {
    transform: scale(0.94);
}

.dest-name {
    color: #fff;
    font-size: 15px;
    font-weight: 600;
}

.page-container {
    padding-bottom: 50px;
}
</style>
