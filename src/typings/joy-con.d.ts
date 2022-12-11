export type JoyConType = 'left' | 'right'

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

interface CommonInput {
  actualAccelerometer: CommonVector
  /** https://learn.sparkfun.com/tutorials/gyroscope/all */
  actualGyroscope: {
    /** degrees per second (°/s)  */
    dps: CommonVector
    /** revolutions per second */
    rps: CommonVector
  }
  actualOrientation: CommonQuaternion
  actualOrientationQuaternion: CommonQuaternion
  quaternion: Quaternion
}

export interface LeftInput extends CommonInput {
  buttonStatus: LeftButtonStatus
}
