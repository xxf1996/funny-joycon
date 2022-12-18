import type { CommonInput, JoyConType, LeftButtonStatus, LeftInput } from '@/typings/joy-con'
import { omit } from 'lodash-es'

export class JoyConEvent extends EventTarget {
  private buttonStatus: Record<string, boolean> = {}
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
    this.dispatchEvent(new CustomEvent<CommonInput>('sensor-input', {
      detail: omit(inputData, ['buttonStatus'])
    }))
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
