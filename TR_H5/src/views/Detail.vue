<script setup>
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'
import { reactive, ref } from 'vue'
import { post } from '../utils/request'
import { planPost, planGet } from '../utils/request'
import { showToast } from 'vant'

const router = useRouter()

const isLoading = ref(true)

const activeDays = ref([])

const activeTimeSlots = reactive({})

const tripData = ref(null)

const error = ref('')

const savePlan = async () => {
    if (!tripData.value) {
        showToast('暂无数据可保存')
        return
    }
    if (!localStorage.getItem('token')) {
        showToast('请先登录后再保存')
        return
    }
    try {
        const res = await planPost('save', {
            destination: tripData.value.destination || formData.destination,
            budget: tripData.value.budget || formData.budget,
            days: Number(tripData.value.days) || Number(formData.days),
            planData: tripData.value
        })
        if (res.success) {
            showToast('保存成功')
        } else {
            showToast(res.error || '保存失败')
        }
    } catch (err) {
        showToast('保存失败，请稍后重试')
    }
}

const fetchTravelData = async () => {
    isLoading.value = true
    error.value = ''
    try {
        const response = await post('/recommend', formData)
        console.log('response', response)
        if (response && response.success) {
            tripData.value = response.data
            // 为每个天的时段面板独立初始化状态
            Object.keys(response.data.plan || {}).forEach(key => {
                activeTimeSlots[key] = []
            })
        } else {
            error.value = response?.error || '接口返回异常'
        }
    } catch (err) {
        console.log('error', err)
        error.value = '网络请求失败，请检查后端服务'
    } finally {
        isLoading.value = false
    }
}

onMounted(async () => {
    const planId = router.currentRoute.value.query.planId

    //从已保存方案进入
    if (planId) {
        isLoading.value = true
        try {
            const res = await planGet(String(planId))
            if (res.success) {
                tripData.value = res.data.planData
                Object.keys(res.data.planData.plan || {}).forEach(key => {
                    activeTimeSlots[key] = []
                })
                formData.destination = res.data.destination
                formData.budget = res.data.budget
                formData.days = res.data.days
            } else {
                error.value = res.error || '方案加载失败'
            }
        } catch (err) {
            error.value = '网络请求失败，请检查后端服务'
        } finally {
            isLoading.value = false
        }
        return
    }

    //从首页进入
    formData.destination = router.currentRoute.value.query.destination
    formData.budget = router.currentRoute.value.query.budget
    formData.days = router.currentRoute.value.query.days

    if (formData.destination && formData.budget && formData.days) {
        fetchTravelData()
    }
})

const formData = reactive({
    destination: '',
    budget: null,
    days: null
})

const dayColors = ['#e74c3c', '#2ecc71', '#3498db', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22']

const formatDayName = (key) => {
    return key.replace('day', 'Day')
}

const getDayColor = (key) => {
    const num = parseInt(key.replace('day', '')) || 1
    return dayColors[(num - 1) % dayColors.length]
}
</script>

<template>
    <div class="page-container trip-page">
        <div class="page-header">
            <van-nav-bar :title="`${formData.destination}行程规划`" :left-arrow="true" left-text="返回" @click-left="router.back()" />
        </div>
        <div class="page-content" style="padding-bottom: 60px;">
            <div v-if="isLoading" class="loading-container">
                <van-loading size="32px" vertical style="margin-top: 80px;">正在规划行程中...</van-loading>
            </div>

            <div v-else-if="error">
                <van-empty image="error" :description="error">
                    <van-button @click="fetchTravelData">点击重试</van-button>
                </van-empty>
            </div>

            <template v-else-if="tripData">
                <van-cell-group inset style="margin-top: 10px;">
                    <van-cell :title="`${tripData.destination} · ${tripData.days}日游`" :value="tripData.budget" />
                </van-cell-group>

                <van-collapse v-model="activeDays" class="days-collapse">
                    <van-collapse-item v-for="(day, key) in tripData.plan" :key="key" :name="key">
                        <template #title>
                            <span :style="{ color: getDayColor(key), fontWeight: 'bold', fontSize: '17px' }">{{ formatDayName(key) }}</span>
                        </template>
                        <van-collapse v-model="activeTimeSlots[key]">
                            <van-collapse-item v-if="day.morning" name="morning">
                                <template #title>🌇 <span class="time-label time-label--morning">上午</span>  {{ day.morning.spot }}</template>
                                <div class="time-slot time-slot--morning">
                                    <div class="spot-budget">预算：{{ day.morning.budget }}</div>
                                    <div class="spot-route">路线：{{ day.morning.route }}</div>
                                </div>
                            </van-collapse-item>
                            <van-collapse-item v-if="day.afternoon" name="afternoon">
                                <template #title>🌆 <span class="time-label time-label--afternoon">下午</span>  {{ day.afternoon.spot }}</template>
                                <div class="time-slot time-slot--afternoon">
                                    <div class="spot-budget">预算：{{ day.afternoon.budget }}</div>
                                    <div class="spot-route">路线：{{ day.afternoon.route }}</div>
                                </div>
                            </van-collapse-item>
                            <van-collapse-item v-if="day.night" name="night">
                                <template #title>🌃 <span class="time-label time-label--night">晚上</span>  {{ day.night.spot }}</template>
                                <div class="time-slot time-slot--night">
                                    <div class="spot-budget">预算：{{ day.night.budget }}</div>
                                    <div class="spot-route">路线：{{ day.night.route }}</div>
                                </div>
                            </van-collapse-item>
                        </van-collapse>
                    </van-collapse-item>
                </van-collapse>

                <van-cell-group inset style="margin-top: 10px;" v-if="tripData.pre_trip_budget_table">
                    <van-cell title="预算明细" title-class="section-title" />
                    <van-cell v-for="(val, key) in tripData.pre_trip_budget_table" :key="key" :title="key" :value="val" />
                </van-cell-group>

                <van-cell-group inset style="margin-top: 10px;" v-if="tripData.notice">
                    <van-cell title="注意事项" title-class="section-title" />
                    <div class="notice-text">{{ tripData.notice }}</div>
                </van-cell-group>

                <van-cell-group inset style="margin-top: 10px;" v-if="tripData.avoid">
                    <van-cell title="避坑指南" title-class="section-title" />
                    <div class="notice-text">{{ tripData.avoid }}</div>
                </van-cell-group>

                <van-cell-group inset style="margin-top: 10px;" v-if="tripData.avoid_pitfalls?.red_list">
                    <van-cell title="避坑指南" title-class="section-title" />
                    <van-cell v-for="(item, idx) in tripData.avoid_pitfalls.red_list" :key="idx" :title="`${idx + 1}. ${item}`" />
                </van-cell-group>

                <div style="display: flex; justify-content: center; gap: 20px; margin: 16px 0;">
                    <van-button type="primary" round :loading="isLoading" @click="fetchTravelData">重新生成</van-button>
                    <van-button type="default" round @click="savePlan">保存方案</van-button>
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>
.trip-page {
    background: var(--van-background);
    min-height: 100vh;
}

.day-title {
    font-size: 18px;
    font-weight: bold;
    color: var(--van-primary-color);
}

.section-title {
    font-size: 16px;
    font-weight: bold;
}

.spot-name {
    font-weight: bold;
    font-size: 15px;
    color: var(--van-text-color);
    margin-bottom: 4px;
}

.spot-budget {
    font-size: 13px;
    color: var(--van-danger-color);
    margin-bottom: 4px;
}

.spot-route {
    font-size: 13px;
    color: var(--van-text-color-2);
    line-height: 1.6;
}

.notice-text {
    padding: 8px 16px 16px;
    font-size: 13px;
    color: var(--van-text-color-2);
    line-height: 1.7;
    white-space: pre-wrap;
}

.time-slot {
    padding: 10px 12px;
    border-radius: 8px;
    border-left: 4px solid;
}

.time-slot--morning {
    background: rgba(46, 204, 113, 0.08);
    border-color: #2ecc71;
    color: #1a7a42;
}

.time-slot--afternoon {
    background: rgba(243, 156, 18, 0.08);
    border-color: #f39c12;
    color: #a0650b;
}

.time-slot--night {
    background: rgba(52, 152, 219, 0.08);
    border-color: #3498db;
    color: #1a5276;
}

.time-label {
    font-weight: bold;
    font-size: 13px;
    padding: 1px 6px;
    border-radius: 4px;
}

.time-label--morning {
    color: #1a7a42;
    background: rgba(46, 204, 113, 0.15);
}

.time-label--afternoon {
    color: #a0650b;
    background: rgba(243, 156, 18, 0.15);
}

.time-label--night {
    color: #1a5276;
    background: rgba(52, 152, 219, 0.15);
}

.days-collapse {
    margin: 10px 16px 0;
    border-radius: 8px;
    overflow: hidden;
}
</style>
