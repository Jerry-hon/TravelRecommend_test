<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()

const formData = reactive({
    destination: '',
    budget: null,
    days: null
})

const showDestination = ref(false)

const destinationColumns = ref([
    {
        text: '北京',
        value: '北京'
    },
    {
        text: '上海',
        value: '上海'
    },
    {
        text: '广州',
        value: '广州'
    }
])

const onConfirm = ({ selectedValues }) => {
    console.log(selectedValues)
    formData.destination = selectedValues[0]
    showDestination.value = false
}

const onCancel = () => {
    showDestination.value = false
}

const active = ref(0)

const showOutput = ref(false)

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
    if(formData.days <= 0||formData.days > 30) {
        showToast('请输入正确的天数，1-30天之间')
        return
    }
    
    isLoading.value = true
    setTimeout(() => {
        isLoading.value = false
        showOutput.value = true
    }, 2000)

    router.push({ name: 'detail' ,query: {
        destination: formData.destination,
        budget: formData.budget,
        days: formData.days
    }})

}



const onChange = (event) => {
  active.value = event.detail
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
                style="margin-bottom: 5px;margin-top: 5px;border-radius: 3;"
                />

            <div class="card search" style="margin-bottom: 5px;margin-top: 5px;border-radius: 3px;background-color: white;padding: 10px;">
                <div style="font-weight: bold;color: black;"> 旅程规划</div>
                <van-field
                @click="showDestination = true"
                    label="目的地"
                    is-link="true"
                    readonly="true"
                    v-model="formData.destination"
                    placeholder="选择目的地"
                    style="background-color: #f5f5f5;border-radius: 10px;width: 95%;margin: 0 auto;margin-bottom: 10px;"
                />
                <van-field
                    type="number"
                    label="预算"
                    v-model="formData.budget"
                    placeholder="输入预算"
                    style="background-color: #f5f5f5;border-radius: 10px;width: 95%;margin: 0 auto;margin-bottom: 10px;"  
                />
                <van-field
                    type="digit"
                    label="天数"
                    v-model="formData.days"
                    placeholder="输入天数"
                    style="background-color: #f5f5f5;border-radius: 10px;width: 95%;margin: 0 auto;margin-bottom: 10px;"  
                />
                <van-button
                    @click="onSubmit"
                    type="primary"
                    block
                    round
                    :loading="isLoading"
                    style="margin-top: 10px;width: 95%;margin: 0 auto"
                >
                    规划行程
                </van-button>
            </div>
            <div class="card"></div>
            <div class="card"></div>
        </div>
        <div v-if="showOutput" class="output" style="margin-bottom: 5px;margin-top: 5px;border-radius: 3px;background-color: white;padding: 10px;">
            
        </div>
        <div class="page-tabbar">
            <van-tabbar v-model="active" @change="onChange">
                <van-tabbar-item icon="home-o" to="/home">首页</van-tabbar-item>
                <van-tabbar-item icon="chat" to="/chat">聊天</van-tabbar-item>
                <van-tabbar-item icon="user" to="/profile">个人</van-tabbar-item>     
            </van-tabbar>
        </div>
        <div>
            <van-popup
                v-model:show="showDestination"
                position="bottom"
                style="height: 50%;" 
            >
                <van-picker
                    :columns="destinationColumns"
                    @confirm="onConfirm"
                    @cancel="onCancel"
                />
            </van-popup>
        </div>
    </div>
</template>
