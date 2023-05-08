import * as JoyCon from '@/plugins/joy-con-webhid'
import { JoyConEvent } from './event'

const LEFT_NAME = 'Joy-Con (L)'
const RIGHT_NAME = 'Joy-Con (R)'
const WIN_NAME = 'Wireless Gamepad' // 不知道为啥windows chrome显示的设备名是这个
export const leftConnected = ref(false)
export const rightConnected = ref(false)
export const leftEvent = new JoyConEvent('left')
export const rightEvent = new JoyConEvent('right')

let timeID = 0

export async function checkJoyCon() {
  const joyCons: any[] = JoyCon.connectedJoyCons.values() || []
  for (const joyCon of joyCons) {
    if (joyCon.eventListenerAttached) {
      continue
    }
    // Open the device and enable standard full mode and inertial measurement
    // unit mode, so the Joy-Con activates the gyroscope and accelerometers.
    await joyCon.open()
    await joyCon.enableStandardFullMode()
    await joyCon.enableIMUMode()
    await joyCon.enableVibration()
    // Get information about the connected Joy-Con.
    // console.log(await joyCon.getDeviceInfo());
    // Rumble.
    await joyCon.rumble(600, 600, 0.5)
    const { productName } = joyCon.device

    if (productName === LEFT_NAME) {
      leftConnected.value = true
      // Listen for HID input reports.
      joyCon.addEventListener('hidinput', leftEvent.handleEvent.bind(leftEvent))
    }

    if (productName === RIGHT_NAME || productName === WIN_NAME) {
      rightConnected.value = true
      // Listen for HID input reports.
      joyCon.addEventListener('hidinput', rightEvent.handleEvent.bind(rightEvent))
    }

    joyCon.eventListenerAttached = true
  }
  if (!Array.isArray(joyCons)) {
    return
  }
  const allAttached = joyCons.every(joyCon => joyCon.eventListenerAttached)
  if (allAttached && joyCons.length > 0 && timeID) {
    clearInterval(timeID)
  }
}

export async function connect() {
  await JoyCon.connectJoyCon()
  timeID = setInterval(checkJoyCon, 2000)
}