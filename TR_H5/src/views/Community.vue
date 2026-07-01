<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

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
