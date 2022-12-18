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
import { ceil, floor, sum } from 'lodash-es'

const no = ref(0)
const started = ref(false)
const target: CommonVector[] = []
const similarity = ref(0)
const SAMPLE_NUM = 100
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

function reMap(start: number, end: number, k: number) {
  const delta = end - start
  return start + k * delta
}

function sampleData(list: CommonVector[], sampleNum = 100): CommonVector[] {
  const listMax = list.length - 1
  const sampleMax = sampleNum - 1

  return new Array(sampleNum).fill(0).map((val, idx) => {
    const mapIndex = idx / sampleMax * listMax
    const startIndex = floor(mapIndex)
    const endIndex = ceil(mapIndex)
    const k = mapIndex - startIndex
    const start = list[startIndex]
    const end = list[endIndex]

    return {
      x: reMap(start.x, end.x, k),
      y: reMap(start.y, end.y, k),
      z: reMap(start.z, end.z, k)
    }
  })
}

function vectorsToNums(list: CommonVector[]): number[] {
  return list.map(item => [item.x, item.y, item.z]).flat()
}

/** 计算两组向量的余弦相似度 */
function cosineSimilarity(a: CommonVector[], b: CommonVector[]) {
  if (a.length !== b.length) {
    return 0
  }
  const listA = vectorsToNums(a)
  const listB = vectorsToNums(b)
  const lengthA = Math.sqrt(sum(listA.map(n => n ** 2)))
  const lengthB = Math.sqrt(sum(listB.map(n => n ** 2)))
  const sumAB = sum(listA.map((n, idx) => n * listB[idx]))

  if (lengthA === 0 || lengthB === 0) {
    return 0
  }

  return sumAB / (lengthA * lengthB)
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
