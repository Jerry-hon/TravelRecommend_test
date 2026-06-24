<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
    <div class="app-container">
        <router-view></router-view>
    </div>
</template>
