<template>
  <div class="flex items-center justify-center gap-1 mt-4">
    <n-input
      v-model:value="name"
      autosize
      class="w-60"
      placeholder="请输入本次训练的手势名称"
    />
    <n-button
      type="primary"
      @click="createTrain"
    >
      新建训练
    </n-button>
  </div>
  <div
    v-if="created"
    class="text-center"
  >
    <h3>
      当前训练姿势：{{ trainName }} (第{{ no }}次)
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
    <n-button
      class="mx-auto"
      type="primary"
      :disabled="no === 0"
      @click="exportData"
    >
      导出训练数据
    </n-button>
  </div>
</template>

<script lang="ts" setup>
import { rightEvent } from '@/plugins/joy-con'
import type { CommonInput, CommonVector } from '@/typings/joy-con'

const name = ref('')
const trainName = ref('')
const no = ref(0)
const created = ref(false)
const started = ref(false)
let records: CommonVector[][] = []
let curRecord: CommonVector[] = []

function toggleStart() {
  if (!created.value) {
    return
  }

  if (!started.value) {
    no.value += 1
    curRecord = []
  } else {
    records.push(curRecord)
  }

  started.value = !started.value
}

function createTrain() {
  if (!name.value) {
    return
  }
  trainName.value = name.value
  name.value = ''
  no.value = 0
  records = []
  created.value = true
}

function exportData() {
  console.log(records)
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
