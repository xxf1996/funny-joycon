import type { CommonVector } from '@/typings/joy-con'
import { ceil, floor, sum, map } from 'lodash-es'

export function reMap(start: number, end: number, k: number) {
  const delta = end - start
  return start + k * delta
}

export function sampleData(list: CommonVector[], sampleNum = 100): CommonVector[] {
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

export function vectorsToNums(list: CommonVector[]): number[] {
  return list.map(item => [item.x, item.y, item.z]).flat()
}

export function cosineSimilarityForList(listA: number[], listB: number[]) {
  if (listA.length !== listB.length) {
    return 0
  }
  const lengthA = Math.sqrt(sum(listA.map(n => n ** 2)))
  const lengthB = Math.sqrt(sum(listB.map(n => n ** 2)))
  const sumAB = sum(listA.map((n, idx) => n * listB[idx]))

  if (lengthA === 0 || lengthB === 0) {
    return 0
  }

  return sumAB / (lengthA * lengthB)
}

/** 计算两组向量的余弦相似度 */
export function cosineSimilarity(a: CommonVector[], b: CommonVector[]) {
  if (a.length !== b.length) {
    return 0
  }

  // 分别计算三个加速度分量上的相似度应该更准确？
  const x = cosineSimilarityForList(map(a, 'x'), map(b, 'x'))
  const y = cosineSimilarityForList(map(a, 'y'), map(b, 'y'))
  const z = cosineSimilarityForList(map(a, 'z'), map(b, 'z'))

  return x * y * z
}