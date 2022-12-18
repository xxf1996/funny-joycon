<template>
  <div class="text-center">
    <h3 class="mb-8">
      手势相似度测试 - 第{{ no }}次
    </h3>
    <p
      v-if="started"
      class="text-green-500"
    >
      进行中
    </p>
    <p
      v-if="!started && no > 0"
      class="text-red-500"
    >
      已结束
    </p>
    <p>square: {{ similarity.square }}</p>
    <p>circle: {{ similarity.circle }}</p>
    <p>star: {{ similarity.star }}</p>
  </div>
</template>

<script lang="ts" setup>
import square from '@/assets/data/square.json'
import circle from '@/assets/data/circle.json'
import star from '@/assets/data/star.json'
import { cosineSimilarity, sampleData } from '@/utils/math'
import { rightEvent } from '@/plugins/joy-con'
import type { CommonInput, CommonVector } from '@/typings/joy-con'

const squareData = sampleData(square)
const circleData = sampleData(circle)
const starData = sampleData(star)
const similarity = reactive({
  square: 0,
  circle: 0,
  star: 0
})

const no = ref(0)
const started = ref(false)
let curRecord: CommonVector[] = []

function toggleStart() {
  if (!started.value) {
    no.value += 1
    curRecord = []
  } else {
    computeSimilarity()
  }

  started.value = !started.value
}

function computeSimilarity() {
  const data = sampleData(curRecord)
  console.log('当前采样：', data)
  similarity.square = cosineSimilarity(squareData, data)
  similarity.circle = cosineSimilarity(circleData, data)
  similarity.star = cosineSimilarity(starData, data)
}

rightEvent.addEventListener('sensor-input', e => {
  if (!started.value) {
    return
  }
  const { detail } = e as CustomEvent<CommonInput>
  curRecord.push(...detail.accelerometers.map(({ x, y, z }) => ({
    x: x.acc,
    y: y.acc,
    z: z.acc
  })))
})

rightEvent.addEventListener('keydown', e => {
  const { detail } = e as CustomEvent<string>
  switch(detail) {
  case 'zr':
    toggleStart()
    break
  default:
    break
  }
})
</script>
