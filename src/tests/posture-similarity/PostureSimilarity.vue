<template>
  <div class="text-center">
    <h3 class="mb-8">
      手势相似度测试 - 第{{ no }}次
    </h3>
    <p>square: {{ similarity.square }}</p>
    <p>circle: {{ similarity.circle }}</p>
    <p>star: {{ similarity.star }}</p>
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
  </div>
  <div
    ref="chartRef"
    class="mx-auto mt-4 w-100 h-100"
  />
</template>

<script lang="ts" setup>
/**
 * // TODO: 如何从一段连续传感器信号中找出动作的起始点然后再进行识别？
 * 1. 可以从加速度向量的长度来判断，设定阈值，当大于某个值时认为开始进行动作，小于某个阈值时认为动作结束？
 **/
import square from '@/assets/data/square.json'
import circle from '@/assets/data/circle.json'
import star from '@/assets/data/star.json'
import { cosineSimilarity, sampleData } from '@/utils/math'
import { rightEvent } from '@/plugins/joy-con'
import type { CommonInput, CommonVector } from '@/typings/joy-con'
import * as echarts from 'echarts'
import type { LineSeriesOption} from 'echarts/charts'
import { LineChart } from 'echarts/charts'
import type { TooltipComponentOption, GridComponentOption, LegendComponentOption } from 'echarts/components'
import { TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import { map, pick } from 'lodash-es'
import { Euler, Vector3 } from 'three'
import { degToRad } from 'three/src/math/MathUtils'

type ECOption = echarts.ComposeOption<LineSeriesOption | TooltipComponentOption | GridComponentOption | LegendComponentOption>

echarts.use([
  LineChart,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  SVGRenderer,
])

const lines: NonNullable<LineSeriesOption>[] = [
  {
    name: 'x(原始值)',
    type: 'line',
    symbol: 'none',
    data: []
  },
  {
    name: 'y(原始值)',
    type: 'line',
    symbol: 'none',
    data: []
  },
  {
    name: 'z(原始值)',
    type: 'line',
    symbol: 'none',
    data: []
  },
  {
    name: 'x(玩家坐标系)',
    type: 'line',
    symbol: 'none',
    data: []
  },
  {
    name: 'y(玩家坐标系)',
    type: 'line',
    symbol: 'none',
    data: []
  },
  {
    name: 'z(玩家坐标系)',
    type: 'line',
    symbol: 'none',
    data: []
  },
]
const chartRef = ref<HTMLElement>()
const chartOption: ECOption = {
  legend: {
    show: true,
  },
  xAxis: {
    type: 'value',
  },
  yAxis: {
    type: 'value'
  },
  tooltip: {
    show: true,
    trigger: 'axis',
    confine: true // 保证tooltip在图表内
  },
  series: lines
}
let chartInstance: null | echarts.ECharts = null


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
    lines[0].data = map(curRecord, 'x').map((val, idx) => [idx, val])
    lines[1].data = map(curRecord, 'y').map((val, idx) => [idx, val])
    lines[2].data = map(curRecord, 'z').map((val, idx) => [idx, val])
    // 用户坐标系：右手为x轴，正前方为y轴，头顶为z轴
    lines[3].data = lines[1].data!.slice(0) // y -> x
    lines[4].data = lines[0].data!.slice(0) // x -> y
    lines[5].data = lines[2].data!.map((val: any) => [val[0], -val[1] - 1]) // -z -> z（加上重力影响）
    chartInstance?.setOption<ECOption>({
      series: lines
    })
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
  const { customOrientation } = detail
  const euler = customOrientation
    ? new Euler(
      degToRad(-Number(customOrientation.alpha)),
      degToRad(-Number(customOrientation.beta)),
      degToRad(-Number(customOrientation.gamma)),
      'ZXY'
    ) // 将逆变换为初始朝向下坐标系的值
    : new Euler()
  curRecord.push(...detail.accelerometers.map(({ x, y, z }) => {
    const acc = new Vector3(x.acc, y.acc, z.acc)

    acc.applyEuler(euler)
    
    return pick(acc, ['x', 'y', 'z'])
  }))
  // const { rps } = detail.actualGyroscope
  // curRecord.push(rps)
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

onMounted(() => {
  if (!chartRef.value) {
    return
  }
  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption(chartOption)
})
</script>
