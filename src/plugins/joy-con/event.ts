import type { JoyConType, LeftButtonStatus, LeftInput } from '@/typings/joy-con'

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
  }

  private hanldeSimpleButton(name: string, status: boolean) {
    const prevStatus = this.buttonStatus[name] ?? false
    this.buttonStatus[name] = status
    if (status === prevStatus) {
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
