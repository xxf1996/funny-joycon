<template>
  <div ref="container" />
</template>

<script lang="ts" setup>
import type { Quaternion, Vector3 } from 'three'
import { PointLight } from 'three'
import { AmbientLight, DirectionalLight, MeshPhongMaterial } from 'three'
import { Clock } from 'three'
import { BoxGeometry} from 'three'
import { DoubleSide, Mesh, PerspectiveCamera, Scene, SphereGeometry, WebGLRenderer } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import AmmoInit from '@/plugins/ammo/ammo.wasm'
import { random } from 'lodash-es'
import { rightEvent } from '@/plugins/joy-con'
import type { CommonInput } from '@/typings/joy-con'

type BodyFunction = (body: any) => void

const container = ref<HTMLElement>()
const rigidBodies: Mesh[] = []
const GRAVITY = -9.8
const MARGIN = 0.05
let Ammo: any = null
let physicsWorld: any
let transformAux1: any
let ball: Mesh
let box: Mesh
let bottom: Mesh
let prevDistance = Number.MAX_SAFE_INTEGER
let curDistance = Number.MAX_SAFE_INTEGER
let collisionCallback: any

const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000)
const scene = new Scene()
const clock = new Clock()
const renderer = new WebGLRenderer({ antialias: true })
const sun = new DirectionalLight(0xffffff, 0.7)
const light = new PointLight(0xffffff, 1.0, 50)
const ambient = new AmbientLight(0xffffff, 0.1)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
camera.lookAt(0, 0, 0)
camera.position.set(0, 0, 10)
light.position.set(0, 0, 5)
light.castShadow = true
sun.position.set(10, 10, 10)
scene.add(sun, light, ambient)

const control = new OrbitControls(camera, renderer.domElement)

function loop () {
  const deltaTime = clock.getDelta()
  updatePhysics(deltaTime)
  checkCollision()
  control.update()
  camera.lookAt(ball.position)
  renderer.render(scene, camera)
  requestAnimationFrame(loop)
}

function initPhysics() {

  // Physics configuration

  const collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration()
  const dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration )
  const broadphase = new Ammo.btDbvtBroadphase()
  const solver = new Ammo.btSequentialImpulseConstraintSolver()
  const softBodySolver = new Ammo.btDefaultSoftBodySolver()
  physicsWorld = new Ammo.btSoftRigidDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration, softBodySolver )
  physicsWorld.setGravity( new Ammo.btVector3( 0, GRAVITY, 0 ) )
  physicsWorld.getWorldInfo().set_m_gravity( new Ammo.btVector3( 0, GRAVITY, 0 ) )
  transformAux1 = new Ammo.btTransform()
}

function initRoom() {
  const sx = 20
  const sy = 10
  const sz = 40

  const left = new Mesh(
    new BoxGeometry(0.1, sy, sz),
    new MeshPhongMaterial({ color: 0xcccccc, side: DoubleSide })
  )
  const leftShape = new Ammo.btBoxShape( new Ammo.btVector3(0.1 * 0.5, sy * 0.5, sz * 0.5) )
  left.position.set(-sx * 0.5, 0, 0)
  left.receiveShadow = true
  createRigidBody(left, leftShape, 0, left.position, left.quaternion)

  const right = new Mesh(
    new BoxGeometry(0.1, sy, sz),
    new MeshPhongMaterial({ color: 0xcccccc, side: DoubleSide })
  )
  const rightShape = new Ammo.btBoxShape( new Ammo.btVector3(0.1 * 0.5, sy * 0.5, sz * 0.5) )
  right.position.set(sx * 0.5, 0, 0)
  right.receiveShadow = true
  createRigidBody(right, rightShape, 0, right.position, right.quaternion)

  const top = new Mesh(
    new BoxGeometry(sx, 0.1, sz),
    new MeshPhongMaterial({ color: 0xcccccc, side: DoubleSide })
  )
  const topShape = new Ammo.btBoxShape( new Ammo.btVector3(sx * 0.5, 0.1 * 0.5, sz * 0.5) )
  top.position.set(0, sy * 0.5, 0)
  top.receiveShadow = true
  createRigidBody(top, topShape, 0, top.position, top.quaternion)

  bottom = new Mesh(
    new BoxGeometry(sx, 0.1, sz),
    new MeshPhongMaterial({ color: 0x80BDF1, side: DoubleSide })
  )
  const bottomShape = new Ammo.btBoxShape( new Ammo.btVector3(sx * 0.5, 0.1 * 0.5, sz * 0.5) )
  bottom.position.set(0, -sy * 0.5, 0)
  bottom.receiveShadow = true
  createRigidBody(bottom, bottomShape, 0, bottom.position, bottom.quaternion)

  const front = new Mesh(
    new BoxGeometry(sx, sy, 0.1),
    new MeshPhongMaterial({ color: 0xcccccc, side: DoubleSide })
  )
  const frontShape = new Ammo.btBoxShape( new Ammo.btVector3(sx * 0.5, sy * 0.5, 0.1 * 0.5) )
  front.position.set(0, 0, sz * 0.5)
  front.receiveShadow = true
  createRigidBody(front, frontShape, 0, front.position, front.quaternion)

  const back = new Mesh(
    new BoxGeometry(sx, sy, 0.1),
    new MeshPhongMaterial({ color: 0xcccccc, side: DoubleSide })
  )
  const backShape = new Ammo.btBoxShape( new Ammo.btVector3(sx * 0.5, sy * 0.5, 0.1 * 0.5) )
  back.position.set(0, 0, -sz * 0.5)
  back.receiveShadow = true
  createRigidBody(back, backShape, 0, back.position, back.quaternion)
}

function initCollisionCallback() {
  let afterCollision = false
  const ballBody = ball.userData.physicsBody
  collisionCallback = new Ammo.ConcreteContactResultCallback()
  // 经测试，该回调函数并不会在每次调用contactPairTest方法都会被触发，一般是在两个物体接近碰撞的时候才会触发……
  collisionCallback.addSingleResult = (cp: any, colObj0Wrap: any, partId0: any, index0: any, colObj1Wrap: any, partId1: any, index1: any) => {
    const contactPoint = Ammo.wrapPointer( cp, Ammo.btManifoldPoint )
    prevDistance = curDistance
    curDistance = contactPoint.getDistance()

    if (curDistance > 0) {
      if (afterCollision && curDistance < prevDistance) {
        console.log('发力')
        setTimeout(() => {
          const v = ballBody.getLinearVelocity()
          v.op_mul(-1.3)
          ballBody.setLinearVelocity(v)
        }, 30)
        afterCollision = false
      }
      return
    }

    afterCollision = true
    console.log('碰撞')
  }
}

/**
 * 检查两个物体间的碰撞情况，参考自：https://medium.com/@bluemagnificent/collision-detection-in-javascript-3d-physics-using-ammo-js-and-three-js-31a5569291ef 
 */
function checkCollision() {
  const ballBody = ball.userData.physicsBody
  physicsWorld.contactPairTest(ballBody, bottom.userData.physicsBody, collisionCallback)
  // console.log('当前距离：', curDistance)
}

function initObject() {
  initRoom()
  ball = new Mesh(
    new SphereGeometry(0.2, 32, 32),
    new MeshPhongMaterial({ color: 0xFFBA26, side: DoubleSide })
  )
  const ballShape = new Ammo.btSphereShape( 0.2 )
  ballShape.setMargin(MARGIN)
  ball.position.set(0, -1, 8)
  ball.castShadow = true
  box = new Mesh(
    new BoxGeometry(1, 1, 1),
    new MeshPhongMaterial({ color: 0xFF4A26 })
  )
  box.position.set(-8, 0, -5)
  const boxShape = new Ammo.btBoxShape(new Ammo.btVector3(1 * 0.5, 1 * 0.5, 1 * 0.5))
  boxShape.setMargin(MARGIN)
  box.castShadow = true

  createRigidBody(ball, ballShape, 2, ball.position, ball.quaternion, (ballBody) => {
    ballBody.setRestitution(0.95) // 碰撞后补偿系数，系数越大越容易反弹
    ballBody.setLinearVelocity(
      new Ammo.btVector3(3, -5, -12)
    )
    console.log(ballBody)
  })
  createRigidBody(box, boxShape, 10, box.position, box.quaternion)
}

function initEvent() {
  window.addEventListener('keydown', e => {
    const ballBody = ball.userData.physicsBody
    const boxBody = box.userData.physicsBody
    const motionState = boxBody.getMotionState()
    motionState.getWorldTransform(transformAux1)
    const boxOrigin = transformAux1.getOrigin()

    switch(e.code) {
    case 'Space':
      ballBody.applyCentralForce(new Ammo.btVector3(
        random(-100, 100, true),
        random(50, 150, true),
        random(-100, 100, true)
      ))
      break
    case 'ArrowLeft':
      transformAux1.setOrigin(new Ammo.btVector3(boxOrigin.x() - 0.1, boxOrigin.y(), boxOrigin.z()))
      boxBody.setWorldTransform(transformAux1)
      break
    case 'ArrowRight':
      transformAux1.setOrigin(new Ammo.btVector3(boxOrigin.x() + 0.1, boxOrigin.y(), boxOrigin.z()))
      boxBody.setWorldTransform(transformAux1)
      break
    case 'ArrowUp':
      transformAux1.setOrigin(new Ammo.btVector3(boxOrigin.x(), boxOrigin.y(), boxOrigin.z() - 0.1))
      boxBody.setWorldTransform(transformAux1)
      break
    case 'ArrowDown':
      transformAux1.setOrigin(new Ammo.btVector3(boxOrigin.x(), boxOrigin.y(), boxOrigin.z() + 0.1))
      boxBody.setWorldTransform(transformAux1)
      break
    default:
      break
    }
  })

  rightEvent.addEventListener('sensor-input', e => {
    const { detail } = e as CustomEvent<CommonInput>
    if (!detail.actualAccelerometer) {
      return
    }
    const boxBody = box.userData.physicsBody
    const force = new Ammo.btVector3(
      detail.actualAccelerometer.x * 9.8 * 10 * 50,
      detail.actualAccelerometer.y * 9.8 * 10 * 50,
      detail.actualAccelerometer.z * 9.8 * 10 * 50
    )
    // console.log(force.length())

    boxBody.applyCentralForce(force)
  })
}

function createRigidBody(object: Mesh, shape: any, mass: number, pos: Vector3, quat: Quaternion, bodyFun?: BodyFunction) {
  object.position.copy(pos)
  object.quaternion.copy(quat)

  const transform = new Ammo.btTransform()
  transform.setIdentity()
  transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) )
  transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) )
  const motionState = new Ammo.btDefaultMotionState( transform )
  const localInertia = new Ammo.btVector3( 0, 0, 0 )
  shape.calculateLocalInertia( mass, localInertia )

  const rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, shape, localInertia )
  const body = new Ammo.btRigidBody( rbInfo )
  // console.log(body)

  if (bodyFun) {
    bodyFun(body)
  } else {
    body.setRestitution(0.75)
  }

  object.userData.physicsBody = body

  scene.add(object)

  if (mass > 0) {
    rigidBodies.push(object)
    // Disable deactivation
    body.setActivationState(4)
  }

  physicsWorld.addRigidBody( body )
}

function updatePhysics(deltaTime: number) {
  physicsWorld.stepSimulation( deltaTime, 10 )

  rigidBodies.forEach(object => {
    const body = object.userData.physicsBody
    const motionState = body.getMotionState()

    if (motionState) {
      motionState.getWorldTransform( transformAux1 )
      const p = transformAux1.getOrigin()
      const q = transformAux1.getRotation()
      object.position.set( p.x(), p.y(), p.z() )
      object.quaternion.set( q.x(), q.y(), q.z(), q.w() )
    }
  })
}

onMounted(async () => {
  if (!container.value) {
    return
  }
  container.value.appendChild(renderer.domElement)
  Ammo = await AmmoInit()
  console.log(Ammo)
  initPhysics()
  initObject()
  initEvent()
  initCollisionCallback()
  loop()
})
</script>
