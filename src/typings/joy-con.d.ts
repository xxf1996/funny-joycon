export type JoyConType = 'left' | 'right'

/** left joy-con 按钮状态；key为按钮名称，value为是否处于按压 */
export interface LeftButtonStatus {
  capture: boolean
  chargingGrip: boolean
  down: boolean
  l: boolean
  left: boolean
  leftStick: boolean
  minus: boolean
  right: boolean
  sl: boolean
  sr: boolean
  up: boolean
  zl: boolean
}

interface CommonVector {
  x: number
  y: number
  z: number
}

interface Quaternion {
  x: number
  y: number
  z: number
  w: number
}

interface CommonQuaternion {
  alpha: string
  beta: string
  gamma: string
}

/** 主要输入数据 */
interface CommonInput {
  /** 平滑后（三个原始采样数据平均）的加速度计数据 */
  actualAccelerometer: CommonVector
  /**
   * 平滑后的陀螺仪数据
   * https://learn.sparkfun.com/tutorials/gyroscope/all
   */
  actualGyroscope: {
    /** degrees per second (°/s)  */
    dps: CommonVector
    /** revolutions per second */
    rps: CommonVector
  }
  /** 平滑后的设备朝向数据 */
  actualOrientation: CommonQuaternion
  actualOrientationQuaternion: CommonQuaternion
  quaternion: Quaternion
}

/** left joy-con 输入数据 */
export interface LeftInput extends CommonInput {
  /** 按钮状态 */
  buttonStatus: LeftButtonStatus
}
