<template>
  <h2 class="title">webpack5-vue3-ts</h2>
  <img :src="smallImg" alt="小于10kb的图片" />
  <img :src="bigImg" alt="大于于10kb的图片" />
</template>

<script setup lang="ts">
import smallImg from './assets/imgs/0.png'
import bigImg from './assets/imgs/1.png'
</script>


<style lang="scss" scoped>
.title {
  color: deeppink;
}
</style>