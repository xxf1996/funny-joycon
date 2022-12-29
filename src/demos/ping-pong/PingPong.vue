<template>
  <div ref="container" />
</template>

<script lang="ts" setup>
import type { Quaternion, Vector3 } from 'three'
import { AmbientLight, DirectionalLight, MeshPhongMaterial } from 'three'
import { Clock } from 'three'
import { BoxGeometry} from 'three'
import { DoubleSide, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Scene, SphereGeometry, WebGLRenderer } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import AmmoInit from '@/plugins/ammo/ammo.wasm'

const container = ref<HTMLElement>()
const rigidBodies: Mesh[] = []
const GRAVITY = -9.8
const MARGIN = 0.05
let Ammo: any = null
let physicsWorld: any
let transformAux1: any

const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000)
const scene = new Scene()
const clock = new Clock()
const renderer = new WebGLRenderer({ antialias: true })
const sun = new DirectionalLight(0xffffff, 0.8)
const ambient = new AmbientLight(0xffffff, 0.1)
renderer.setSize(window.innerWidth, window.innerHeight)
camera.lookAt(0, 0, 0)
camera.position.set(0, 0, 20)
sun.position.set(10, 10, 10)
scene.add(sun, ambient)

const control = new OrbitControls(camera, renderer.domElement)

function loop () {
  const deltaTime = clock.getDelta()
  updatePhysics(deltaTime)
  control.update()
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

function initObject() {
  const floor = new Mesh(
    new BoxGeometry(20, 40, 0.1),
    new MeshPhongMaterial({ color: 0xcccccc, side: DoubleSide })
  )
  const floorShape = new Ammo.btBoxShape( new Ammo.btVector3( 20 * 0.5, 40 * 0.5, 0.1 * 0.5 ) )
  floorShape.setMargin(MARGIN)
  floor.position.set(0, 0, 0)
  floor.rotateX(90)
  const ball = new Mesh(
    new SphereGeometry(0.2, 32, 32),
    new MeshPhongMaterial({ color: 0xFFBA26, side: DoubleSide })
  )
  const ballShape = new Ammo.btSphereShape( 0.2 )
  ballShape.setMargin(MARGIN)
  ball.position.set(0, 5, 0)

  createRigidBody(floor, floorShape, 0, floor.position, floor.quaternion)
  createRigidBody(ball, ballShape, 1, ball.position, ball.quaternion)
}

function createRigidBody(object: Mesh, shape: any, mass: number, pos: Vector3, quat: Quaternion) {
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
  body.setRestitution(0.75) // 碰撞后补偿系数，系数越大越容易反弹

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
  loop()
})
</script>
