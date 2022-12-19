<template>
  <div class="text-center">
    <h3 class="mb-8">
      相似度计算测试 - 第{{ no }}次
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
    <p>余弦相似度：{{ similarity }}</p>
  </div>
</template>

<script lang="ts" setup>
/**
 * 基于余项相似度计算手势运动之间的匹配程度，目前看来还是可行的；
 * 参考：https://zhuanlan.zhihu.com/p/33164335 
 */
import { rightEvent } from '@/plugins/joy-con'
import type { CommonInput, CommonVector } from '@/typings/joy-con'
import { sampleData, cosineSimilarity } from '@/utils/math'

const no = ref(0)
const started = ref(false)
const target: CommonVector[] = []
const similarity = ref(0)
const SAMPLE_NUM = 200
let curRecord: CommonVector[] = []

function toggleStart() {
  if (!started.value) {
    no.value += 1
    curRecord = []
  } else {
    if (no.value === 1) {
      console.log('原始数据：', curRecord)
      target.push(...sampleData(curRecord, SAMPLE_NUM)) // 将第一次录入数据作为目标手势参考数据
      console.log('目标数据：', target)
    } else {
      computeSimilarity()
    }
  }

  started.value = !started.value
}

function computeSimilarity() {
  if (target.length === 0 || curRecord.length === 0) {
    return
  }
  const data = sampleData(curRecord, SAMPLE_NUM)
  console.log('当前采样：', data)
  similarity.value = cosineSimilarity(target, data)
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
