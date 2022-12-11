<template>
  <div
    ref="snakeRef"
    class="snake h-screen flex flex-col items-center justify-center"
  >
    <p>分数：{{ score }}</p>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import p5 from 'p5'
import snake, { score, play, gameOver } from './snake'
import { leftEvent } from '@/plugins/joy-con'

const snakeRef = ref<HTMLDivElement>()
let sketch: null | p5 = null

onMounted(() => {
  if (!snakeRef.value) {
    return
  }
  sketch = new p5(snake, snakeRef.value)
  console.log(sketch)
})

leftEvent.addEventListener('keydown', e => {
  if (!sketch) {
    return
  }
  const { detail } = e as CustomEvent<string>
    switch(detail) {
      case 'zl':
        sketch.keyCode = 32
        sketch.keyPressed()
        break
      case 'left':
        sketch.keyCode = 37
        sketch.keyPressed()
        break
      case 'right':
        sketch.keyCode = 39
        sketch.keyPressed()
        break
      case 'up':
        sketch.keyCode = 38
        sketch.keyPressed()
        break
      case 'down':
        sketch.keyCode = 40
        sketch.keyPressed()
        break
      default:
        break
    }
})
</script>

<style>
/* FIXME: 这里加了scoped，@apply指令就不生效了，为啥？ */
.snake canvas {
  @apply border border-gray-500;
}
</style>
