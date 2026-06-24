<script setup>
import { ref } from 'vue'

const active = ref(2)

const onChange = (event) => {
  active.value = event.detail
}
</script>

<template>
    <div class="page-container">
        <div class="page-header">
            <van-nav-bar title="个人" />
        </div>
        <div class="page-content">
            我是个人
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
