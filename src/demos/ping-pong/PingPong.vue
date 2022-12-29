<template>
  <div ref="container" />
</template>

<script lang="ts" setup>
import { DoubleSide, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Scene, SphereGeometry, WebGLRenderer } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import AmmoInit from '@/plugins/ammo/ammo.wasm'

const container = ref<HTMLElement>()

const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000)
const scene = new Scene()
const renderer = new WebGLRenderer({ antialias: true })
let Ammo: any = null
renderer.setSize(window.innerWidth, window.innerHeight)
camera.lookAt(0, 0, 0)
camera.position.set(0, 0, 20)

const control = new OrbitControls(camera, renderer.domElement)
const floor = new Mesh(
  new PlaneGeometry(10, 20),
  new MeshBasicMaterial({ color: 0xcccccc, side: DoubleSide })
)
floor.position.set(0, 0, 0)
floor.rotateX(90)
const ball = new Mesh(
  new SphereGeometry(0.2, 32, 32),
  new MeshBasicMaterial({ color: 0xFFBA26, side: DoubleSide })
)
ball.position.set(0, 2, 0)

scene.add(floor, ball)

function loop () {
  control.update()
  renderer.render(scene, camera)
  requestAnimationFrame(loop)
}

onMounted(() => {
  AmmoInit().then((res: any) => {
    Ammo = res
    console.log(Ammo)
  })
  if (!container.value) {
    return
  }
  container.value.appendChild(renderer.domElement)
  loop()
})
</script>
