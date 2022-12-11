import * as JoyCon from '@/plugins/joy-con-webhid'
import { JoyConEvent } from './event'

const LEFT_NAME = 'Joy-Con (L)'
const RIGHT_NAME = 'Joy-Con (R)'
export const leftConnected = ref(false)
export const rightConnected = ref(false)
export const leftEvent = new JoyConEvent('left')

function checkJoyCon() {
  const timeID = setInterval(async () => {
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
      // Listen for HID input reports.
      joyCon.addEventListener('hidinput', leftEvent.handleEvent.bind(leftEvent))
      joyCon.eventListenerAttached = true

      if (productName === LEFT_NAME) {
        leftConnected.value = true
      }

      if (productName === RIGHT_NAME) {
        rightConnected.value = true
      }
    }
    if (!Array.isArray(joyCons)) {
      return
    }
    const allAttached = joyCons.every(joyCon => joyCon.eventListenerAttached)
    if (allAttached && joyCons.length > 0) {
      clearInterval(timeID)
    }
  }, 2000)
}

export async function connect() {
  await JoyCon.connectJoyCon()
  checkJoyCon()
}