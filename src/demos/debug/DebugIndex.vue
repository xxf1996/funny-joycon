<template>
  <div>
    <button @click="connect">
      connect
    </button>
  </div>
</template>

<script lang="ts" setup>
import * as JoyCon from '@/plugins/joy-con-webhid'

function checkJoyCon() {
  setInterval(async () => {
    for (const joyCon of JoyCon.connectedJoyCons.values()) {
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
      // Listen for HID input reports.
      joyCon.addEventListener('hidinput', ({ detail }) => {
        // Careful, this fires at ~60fps.
        console.log(`Input report from ${joyCon.device.productName}:`, detail)
      })
      joyCon.eventListenerAttached = true
    }
  }, 2000)
}

async function connect() {
  await JoyCon.connectJoyCon()
  checkJoyCon()
}
</script>
