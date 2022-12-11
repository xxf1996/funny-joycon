<template>
  <div
    class="fixed right-4 top-4 flex"
    @click="connect"
  >
    <img
      src="@/assets/joy-con-left.png"
      width="24"
      :class="leftConnected ? '': 'filter grayscale-[0.95]'"
    >
    <img
      src="@/assets/joy-con-right.png"
      width="24"
      :class="rightConnected ? '': 'filter grayscale-[0.95]'"
    >
  </div>
</template>

<script lang="ts" setup>
import { leftConnected, rightConnected, connect, leftEvent } from '@/plugins/joy-con'

leftEvent.addEventListener('keydown', (e) => {
  console.log(e)
})
</script>
