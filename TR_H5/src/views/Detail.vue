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
        if (response && response.success) {
            tripData.value = response.data
            Object.keys(response.data.plan || {}).forEach(key => {
                activeTimeSlots[key] = []
            })
        } else {
            error.value = response?.error || '接口返回异常'
        }
    } catch (err) {
        error.value = '网络请求失败，请检查后端服务'
    } finally {
        isLoading.value = false
    }
}

onMounted(async () => {
    const planId = router.currentRoute.value.query.planId

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

const dayGradients = [
    'linear-gradient(135deg, #e74c3c, #c0392b)',
    'linear-gradient(135deg, #2ecc71, #27ae60)',
    'linear-gradient(135deg, #3498db, #2980b9)',
    'linear-gradient(135deg, #f39c12, #e67e22)',
    'linear-gradient(135deg, #9b59b6, #8e44ad)',
    'linear-gradient(135deg, #1abc9c, #16a085)',
    'linear-gradient(135deg, #e67e22, #d35400)',
]

const formatDayName = (key) => {
    return key.replace('day', 'Day')
}

const getDayIndex = (key) => {
    return (parseInt(key.replace('day', '')) || 1) - 1
}

const getDayGradient = (key) => {
    return dayGradients[getDayIndex(key) % dayGradients.length]
}

const getDayBadgeBg = (key) => {
    return dayGradients[getDayIndex(key) % dayGradients.length]
}
</script>

<template>
    <div class="page-container">
        <div class="page-header">
            <van-nav-bar 
                :title="`${formData.destination} · 行程规划`" 
                :left-arrow="true" 
                left-text="返回" 
                @click-left="router.back()" 
            />
        </div>

        <div class="page-content">
            <!-- 加载中 -->
            <div v-if="isLoading" class="loading-area">
                <van-loading size="32px" vertical color="#ff6b35" style="margin-top: 80px;">
                    正在为您规划行程...
                </van-loading>
                <div class="skeleton" style="width: 80%; height: 16px; margin: 24px auto 0; max-width: 300px;"></div>
                <div class="skeleton" style="width: 60%; height: 16px; margin: 12px auto 0; max-width: 240px;"></div>
            </div>

            <!-- 错误 -->
            <div v-else-if="error">
                <van-empty image="error" :description="error">
                    <van-button round type="primary" class="btn-gradient" @click="fetchTravelData">
                        点击重试
                    </van-button>
                </van-empty>
            </div>

            <!-- 行程数据 -->
            <template v-else-if="tripData">
                <!-- 概览卡片 -->
                <div class="trip-overview card" :style="{ background: 'linear-gradient(135deg, rgba(255,107,53,0.05), rgba(247,147,30,0.08))' }">
                    <div class="overview-dest">{{ tripData.destination }}</div>
                    <div class="overview-stats">
                        <div class="stat-item">
                            <span class="stat-value">{{ tripData.days }}</span>
                            <span class="stat-label">天</span>
                        </div>
                        <div class="stat-divider"></div>
                        <div class="stat-item">
                            <span class="stat-value">{{ tripData.budget }}</span>
                            <span class="stat-label">预算</span>
                        </div>
                    </div>
                </div>

                <!-- 日程 -->
                <van-collapse v-model="activeDays" class="days-collapse">
                    <van-collapse-item v-for="(day, key) in tripData.plan" :key="key" :name="key">
                        <template #title>
                            <div class="day-title-row">
                                <span class="day-badge" :style="{ background: getDayBadgeBg(key) }">
                                    {{ formatDayName(key) }}
                                </span>
                                <span class="day-spots-count" v-if="day.morning || day.afternoon || day.night">
                                    {{ (day.morning ? 1 : 0) + (day.afternoon ? 1 : 0) + (day.night ? 1 : 0) }} 个行程
                                </span>
                            </div>
                        </template>

                        <van-collapse v-model="activeTimeSlots[key]">
                            <van-collapse-item v-if="day.morning" name="morning">
                                <template #title>
                                    <span class="time-badge time-badge--morning">上午</span>
                                    <span>{{ day.morning.spot }}</span>
                                </template>
                                <div class="time-detail time-detail--morning">
                                    <div class="detail-row">
                                        <span class="detail-label">预算</span>
                                        <span class="detail-val budget-val">{{ day.morning.budget }}</span>
                                    </div>
                                    <div class="detail-row" v-if="day.morning.route">
                                        <span class="detail-label">路线</span>
                                        <span class="detail-val">{{ day.morning.route }}</span>
                                    </div>
                                </div>
                            </van-collapse-item>

                            <van-collapse-item v-if="day.afternoon" name="afternoon">
                                <template #title>
                                    <span class="time-badge time-badge--afternoon">下午</span>
                                    <span>{{ day.afternoon.spot }}</span>
                                </template>
                                <div class="time-detail time-detail--afternoon">
                                    <div class="detail-row">
                                        <span class="detail-label">预算</span>
                                        <span class="detail-val budget-val">{{ day.afternoon.budget }}</span>
                                    </div>
                                    <div class="detail-row" v-if="day.afternoon.route">
                                        <span class="detail-label">路线</span>
                                        <span class="detail-val">{{ day.afternoon.route }}</span>
                                    </div>
                                </div>
                            </van-collapse-item>

                            <van-collapse-item v-if="day.night" name="night">
                                <template #title>
                                    <span class="time-badge time-badge--night">晚上</span>
                                    <span>{{ day.night.spot }}</span>
                                </template>
                                <div class="time-detail time-detail--night">
                                    <div class="detail-row">
                                        <span class="detail-label">预算</span>
                                        <span class="detail-val budget-val">{{ day.night.budget }}</span>
                                    </div>
                                    <div class="detail-row" v-if="day.night.route">
                                        <span class="detail-label">路线</span>
                                        <span class="detail-val">{{ day.night.route }}</span>
                                    </div>
                                </div>
                            </van-collapse-item>
                        </van-collapse>
                    </van-collapse-item>
                </van-collapse>

                <!-- 预算明细 -->
                <div class="card" v-if="tripData.pre_trip_budget_table">
                    <div class="card-title">预算明细</div>
                    <div 
                        v-for="(val, key) in tripData.pre_trip_budget_table" 
                        :key="key" 
                        class="budget-row"
                    >
                        <span>{{ key }}</span>
                        <span class="budget-amount">{{ val }}</span>
                    </div>
                </div>

                <!-- 注意事项 -->
                <div class="card" v-if="tripData.notice">
                    <div class="card-title">注意事项</div>
                    <div class="info-text">{{ tripData.notice }}</div>
                </div>

                <!-- 避坑指南 -->
                <div class="card" v-if="tripData.avoid">
                    <div class="card-title">避坑指南</div>
                    <div class="info-text">{{ tripData.avoid }}</div>
                </div>

                <!-- 操作按钮 -->
                <div class="action-buttons">
                    <van-button type="primary" round :loading="isLoading" @click="fetchTravelData" class="btn-gradient">
                        重新生成
                    </van-button>
                    <van-button type="default" round @click="savePlan" style="font-weight: 600;">
                        保存方案
                    </van-button>
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>
.loading-area {
    text-align: center;
}

/* 概览卡片 */
.trip-overview {
    text-align: center;
    border-radius: 16px;
    margin-bottom: 14px;
}

.overview-dest {
    font-size: 22px;
    font-weight: 800;
    color: var(--travel-primary);
    margin-bottom: 14px;
}

.overview-stats {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 32px;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.stat-value {
    font-size: 28px;
    font-weight: 800;
    color: #333;
    line-height: 1;
}

.stat-label {
    font-size: 12px;
    color: #999;
    margin-top: 4px;
}

.stat-divider {
    width: 1px;
    height: 36px;
    background: #e0e0e0;
}

/* 日程折叠 */
.days-collapse {
    margin-bottom: 14px;
    border-radius: 12px;
    overflow: hidden;
}

.days-collapse :deep(.van-collapse-item__title) {
    padding: 14px 16px;
}

.day-title-row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.day-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px 12px;
    border-radius: 6px;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    min-width: 48px;
}

.day-spots-count {
    font-size: 12px;
    color: #999;
    font-weight: normal;
}

/* 时段标签 */
.time-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    margin-right: 8px;
}

.time-badge--morning {
    color: #1a7a42;
    background: rgba(46, 204, 113, 0.12);
}

.time-badge--afternoon {
    color: #a0650b;
    background: rgba(243, 156, 18, 0.12);
}

.time-badge--night {
    color: #1a5276;
    background: rgba(52, 152, 219, 0.12);
}

/* 时段详情 */
.time-detail {
    padding: 12px;
    border-radius: 10px;
    border-left: 4px solid;
    font-size: 13px;
}

.time-detail--morning {
    background: rgba(46, 204, 113, 0.06);
    border-color: #2ecc71;
}

.time-detail--afternoon {
    background: rgba(243, 156, 18, 0.06);
    border-color: #f39c12;
}

.time-detail--night {
    background: rgba(52, 152, 219, 0.06);
    border-color: #3498db;
}

.detail-row {
    display: flex;
    gap: 8px;
    margin-bottom: 6px;
    line-height: 1.6;
}

.detail-row:last-child {
    margin-bottom: 0;
}

.detail-label {
    color: #999;
    flex-shrink: 0;
    font-size: 12px;
}

.detail-val {
    color: #555;
}

.budget-val {
    color: var(--travel-primary);
    font-weight: 600;
}

/* 预算行 */
.budget-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px dashed #f0f0f0;
    font-size: 14px;
    color: #555;
}

.budget-row:last-child {
    border-bottom: none;
}

.budget-amount {
    font-weight: 600;
    color: var(--travel-primary);
}

/* 信息文本 */
.info-text {
    padding: 4px 0;
    font-size: 14px;
    color: #666;
    line-height: 1.8;
    white-space: pre-wrap;
}

/* 操作按钮 */
.action-buttons {
    display: flex;
    gap: 16px;
    margin: 20px 0 30px;
}

.action-buttons > * {
    flex: 1;
}

.rounded-field {
    background: #f5f5f5 !important;
    border-radius: 10px !important;
    margin-bottom: 10px;
}
</style>
