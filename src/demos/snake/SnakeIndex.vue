<template>
  <div
    ref="snakeRef"
    class="snake h-screen flex items-center justify-center"
  />
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import p5 from 'p5'
import snake from './snake'

const snakeRef = ref<HTMLDivElement>()
let sketch: null | p5 = null

onMounted(() => {
  if (!snakeRef.value) {
    return
  }
  sketch = new p5(snake, snakeRef.value)
  console.log(sketch)
})
</script>

<style>
/* FIXME: 这里加了scoped，@apply指令就不生效了，为啥？ */
.snake > canvas {
  @apply border border-gray-500;
}
</style>
