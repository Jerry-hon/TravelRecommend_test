<script setup>
</script>

<template>
    <div class="app-container">
        <router-view v-slot="{ Component }">
            <transition name="page" mode="out-in">
                <component :is="Component" />
            </transition>
        </router-view>
    </div>
</template>

<style>
.app-container {
    width: 100%;
    min-height: 100vh;
    overflow-x: hidden;
}
</style>
