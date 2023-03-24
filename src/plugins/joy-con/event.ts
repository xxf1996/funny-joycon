import type { CommonInput, CommonQuaternion, CommonVector, JoyConType, LeftButtonStatus, LeftInput } from '@/typings/joy-con'
import { omit } from 'lodash-es'
import { Euler, Vector3 } from 'three'
import { degToRad } from 'three/src/math/MathUtils'

const zeroBias = 0.0125
const bias = 0.75
// As we only can cover half (PI rad) of the full spectrum (2*PI rad) we multiply
// the unit vector with values from [-1, 1] with PI/2, covering [-PI/2, PI/2].
const scale = Math.PI / 2
/** rps静止阈值，低于此数则视为静止 */
const minRps = 0.0002

export class JoyConEvent extends EventTarget {
  private buttonStatus: Record<string, boolean> = {}
  private lastValues = {
    time: 0,
    alpha: 0,
    beta: 0,
    gamma: 0
  }
  constructor(private type: JoyConType) {
    super()
  }

  handleEvent({ detail }: CustomEvent<LeftInput>) {
    // console.log(detail)
    for (const buttonName in detail.buttonStatus) {
      this.hanldeSimpleButton(buttonName, detail.buttonStatus[buttonName as keyof LeftButtonStatus])
    }
    this.handleSensorData(detail)
  }

  private handleSensorData(inputData: LeftInput) {
    const { actualAccelerometer, actualGyroscope, actualOrientation, accelerometers } = inputData
    const customOrientation = actualAccelerometer && actualGyroscope ? this.getOrientation(actualAccelerometer, actualGyroscope.rps) : actualOrientation
    const userAcceleration = this.getUserAcceleration(customOrientation, accelerometers)
    const commonInput: CommonInput = {
      ...omit(inputData, ['buttonStatus']),
      customOrientation,
      userAcceleration
    }
    this.dispatchEvent(new CustomEvent<CommonInput>('sensor-input', {
      detail: commonInput
    }))
  }

  /**
   * 基于加速度和陀螺仪计算朝向，来源：https://github.com/tomayac/joy-con-webhid/blob/518a5d34d585e1844b6daf42310b975ab2631835/src/parse.js#L79
   * 主要是修正较小的陀螺仪读数对朝向计算的干扰，因为静止的时候陀螺仪的读数会回归到0的附近，而actualGyroscope则是平滑后的结果，所以陀螺仪一旦静止则会迅速归零
   * // TODO 找到合适的陀螺仪静止噪音阈值
   * @param accelerometer 当前加速度
   * @param gyroscope 当前陀螺仪读数（rps）
   * @returns 
   */
  private getOrientation(accelerometer: CommonVector, gyroscope: CommonVector): CommonQuaternion {
    const now = Date.now()
    const dt = this.lastValues.time ? (now - this.lastValues.time) / 1000 : 0
    this.lastValues.time = now

    // Treat the acceleration vector as an orientation vector by normalizing it.
    // Keep in mind that if the device is flipped, the vector will just be
    // pointing in the other direction, so we have no way to know from the
    // accelerometer data which way the device is oriented.
    const norm = Math.sqrt(
      accelerometer.x ** 2 + accelerometer.y ** 2 + accelerometer.z ** 2
    )

    if (Math.abs(gyroscope.z) > minRps) {
      this.lastValues.alpha = (1 - zeroBias) * (this.lastValues.alpha + gyroscope.z * dt)
    }
    if (norm !== 0) {
      if (Math.abs(gyroscope.x) > minRps) {
        this.lastValues.beta =
          bias * (this.lastValues.beta + gyroscope.x * dt) +
          (1.0 - bias) * ((accelerometer.x * scale) / norm)
      }
      
      if (Math.abs(gyroscope.y) > minRps) {
        this.lastValues.gamma =
        bias * (this.lastValues.gamma + gyroscope.y * dt) +
        (1.0 - bias) * ((accelerometer.y * -scale) / norm)
      }
    }

    return {
      alpha:
        ((((this.lastValues.alpha * 180) / Math.PI) * 430) % 360).toFixed(6),
      beta: ((-1 * (this.lastValues.beta * 180)) / Math.PI).toFixed(6),
      gamma: ((this.lastValues.gamma * 180) / Math.PI).toFixed(6)
    }
  }

  /** 清空joycon朝向信息，相当于设置当前朝向为初始状态 */
  clearOrientationStatus() {
    this.lastValues.alpha = 0
    this.lastValues.beta = 0
    this.lastValues.gamma = 0
  }

  private getUserAcceleration(customOrientation: CommonQuaternion<string>, accelerometers: LeftInput['accelerometers']): CommonVector {
    if (!customOrientation || !accelerometers) {
      return {
        x: 0,
        y: 0,
        z: 0
      }
    }

    const eular = new Euler(
      degToRad(-Number(customOrientation.alpha)),
      degToRad(-Number(customOrientation.beta)),
      degToRad(-Number(customOrientation.gamma)),
      'ZXY'
    ) // 逆变换为初始朝向下坐标系的值
    const { x, y, z } = accelerometers[0]
    const acc = new Vector3(x.acc, y.acc, z.acc)

    acc.applyEuler(eular)

    return {
      x: acc.y, // y -> x
      y: acc.x, // x -> y
      z: -acc.z - 1 // -z -> z（加上重力影响） // TODO: 重力应该跟设备朝向有关
    }
  }

  private hanldeSimpleButton(name: string, status: boolean) {
    const prevStatus = this.buttonStatus[name] ?? false
    this.buttonStatus[name] = status
    if (status === prevStatus) {
      if (status) { // 持续按压状态
        this.dispatchEvent(new CustomEvent<string>('keypress', {
          detail: name
        }))
      }
      return
    }
    if (prevStatus === false && status === true) {
      this.dispatchEvent(new CustomEvent<string>('keydown', {
        detail: name
      }))
    } else {
      this.dispatchEvent(new CustomEvent<string>('keyup', {
        detail: name
      }))
    }
  }
}
