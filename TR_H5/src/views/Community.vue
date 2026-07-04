<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FloatingBubble, showToast } from 'vant'

const router = useRouter()

const offset = ref({ x: 0, y: 0 })

onMounted(() => {
    const bottom = window.innerHeight - 120
    offset.value = { x: 20, y: bottom }
})

const newPost = () => {
    showToast('发布新帖子')
}

const active = ref(2)



const onChange = (event) => {
  active.value = event.detail
}
</script>

<template>
    <div class="page-container">
        <div class="page-header">
            <van-nav-bar title="社区" />
        </div>
        <div class="page-content" style="padding: 10px;">
            <van-empty description="社区功能开发中..." />
        </div>

        <van-floating-bubble icon="add" @click="newPost" :offset="offset" />
        
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
