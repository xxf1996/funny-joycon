<template>
  <div
    class="joycon"
    @click="connect"
  >
    <img
      src="@/assets/joy-con-left.png"
      width="24"
      :class="leftConnected ? '': 'filter grayscale-[0.95]'"
    >
    <img
      class="joycon-right"
      src="@/assets/joy-con-right.png"
      width="24"
      :class="rightConnected ? '': 'filter grayscale-[0.95]'"
    >
  </div>
</template>

<script lang="ts" setup>
import { leftConnected, rightConnected, connect, leftEvent, checkJoyCon, rightEvent } from '@/plugins/joy-con'
import type { CommonQuaternion, CommonInput } from '@/typings/joy-con'

const right = reactive({
  alpha: '0deg',
  beta: '0deg',
  gamma: '0deg',
})

leftEvent.addEventListener('keydown', (e) => {
  console.log(e)
})

rightEvent.addEventListener('keydown', (e) => {
  const { detail } = e as CustomEvent<string>

  if (detail === 'home') {
    // right.alpha = '0deg'
    // right.beta = '0deg'
    // right.gamma = '0deg'
    rightEvent.clearOrientationStatus()
  }
})

rightEvent.addEventListener('sensor-input', e => {
  const { detail: { customOrientation } } = e as CustomEvent<CommonInput>
  if (!customOrientation) {
    return
  }
  // 基于欧拉角可视化右手柄朝向
  right.alpha = `${customOrientation.alpha}deg`
  right.beta = `${customOrientation.beta}deg`
  right.gamma = `${customOrientation.gamma}deg`
})

onMounted(() => {
  setTimeout(checkJoyCon, 2000) // 检测当前是否已经有joycon进行连接了
})
</script>

<style scoped>
.joycon {
  perspective: 1000px;
  transform-style: preserve-3d;
  @apply fixed right-4 top-4 flex;
  --right-alpha: v-bind('right.alpha');
  --right-beta: v-bind('right.beta');
  --right-gamma: v-bind('right.gamma');
}

.joycon-right {
  transform: rotateZ(var(--right-alpha)) rotateX(var(--right-beta))
    rotateY(var(--right-gamma));
}
</style>
