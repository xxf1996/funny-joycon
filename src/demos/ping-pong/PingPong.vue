<template>
  <div ref="container" />
</template>

<script lang="ts" setup>
import type { Quaternion} from 'three'
import { Euler} from 'three'
import { ArrowHelper} from 'three'
import { LineBasicMaterial, Vector3 } from 'three'
import { AxesHelper } from 'three'
import { TextureLoader } from 'three'
import { PointLight } from 'three'
import { AmbientLight, DirectionalLight, MeshPhongMaterial } from 'three'
import { Clock } from 'three'
import { BoxGeometry} from 'three'
import { DoubleSide, Mesh, PerspectiveCamera, Scene, SphereGeometry, WebGLRenderer } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import AmmoInit from '@/plugins/ammo/ammo.wasm'
import { debounce, random, throttle } from 'lodash-es'
import { rightEvent } from '@/plugins/joy-con'
import type { CommonInput } from '@/typings/joy-con'
import ballTextureUrl from '@/assets/TennisBallColorMap.jpeg'
import ballBumpUrl from '@/assets/TennisBallBump.jpeg'
import { promiseTimeout } from '@vueuse/core'
import { degToRad } from 'three/src/math/MathUtils'

type BodyFunction = (body: any) => void

const container = ref<HTMLElement>()
const rigidBodies: Mesh[] = []
const GRAVITY = -9.8
const MARGIN = 0.05
const BALL_RADIUS = 0.2
/** 连续两次击打之间的最小时间差（毫秒） */
const MIN_HIT_DURATION = 500

let Ammo: any = null
let physicsWorld: any
let transformAux1: any
let ball: Mesh
let box: Mesh
let bottom: Mesh
let prevDistance = Number.MAX_SAFE_INTEGER
let curDistance = Number.MAX_SAFE_INTEGER
let collisionCallback: any
let afterCollision = false
let canHit = false
/** z轴方向 */
// let hitDirection: -1 | 1 = -1
let falled = false
let prevAcc = new Vector3(0, 0, 0)
let prevHitTime = 0

const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000)
const scene = new Scene()
const clock = new Clock()
const renderer = new WebGLRenderer({ antialias: true })
const sun = new DirectionalLight(0xffffff, 0.7)
const light = new PointLight(0xffffff, 1.0, 50)
const ambient = new AmbientLight(0xffffff, 0.1)
const forceArrow = new ArrowHelper(undefined, new Vector3(0, 1, 10), 0.5)
forceArrow.setColor(0xff3366)
forceArrow.scale.setScalar(3)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
camera.lookAt(0, 0, 0)
camera.position.set(0, 1, 20)
light.position.set(0, 0, 5)
light.castShadow = true
sun.position.set(10, 10, 10)
scene.add(sun, light, ambient, forceArrow)

const control = new OrbitControls(camera, renderer.domElement)

function loop () {
  const deltaTime = clock.getDelta()
  updatePhysics(deltaTime)
  // checkCollision()
  checkHitStatus()
  control.update()
  // camera.lookAt(ball.position)
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

  // 隔板物体（固定，所以质量为0）
  const mid = new Mesh(
    new BoxGeometry(sx, 1.0, 0.1),
    new MeshPhongMaterial({ color: 0xffcccc, side: DoubleSide })
  )
  const midShape = new Ammo.btBoxShape( new Ammo.btVector3(sx * 0.5, 1.0 * 0.5, 0.1 * 0.5) )
  mid.position.set(0, -sy * 0.5, 0)
  mid.receiveShadow = true
  createRigidBody(mid, midShape, 0, mid.position, mid.quaternion)
}

/**
 * 基于AABB计算球体和地板的表面距离
 */
function getBallAndFloorDistance() {
  const ballBody = ball.userData.physicsBody
  const floorBody = bottom.userData.physicsBody
  const ballMin = new Ammo.btVector3(0, 0, 0)
  const ballMax = new Ammo.btVector3(0, 0, 0)
  const floorMin = new Ammo.btVector3(0, 0, 0)
  const floorMax = new Ammo.btVector3(0, 0, 0)

  ballBody.getAabb(ballMin, ballMax)
  floorBody.getAabb(floorMin, floorMax)

  return ballMin.y() - floorMax.y()
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
    console.log('碰撞', getBallAndFloorDistance())
  }
}

/**
 * 检查两个物体间的碰撞情况，参考自：https://medium.com/@bluemagnificent/collision-detection-in-javascript-3d-physics-using-ammo-js-and-three-js-31a5569291ef 
 */
function checkCollision() {
  const ballBody = ball.userData.physicsBody
  // physicsWorld.contactPairTest(ballBody, bottom.userData.physicsBody, collisionCallback)
  // console.log('当前距离：', curDistance)

  curDistance = getBallAndFloorDistance()

  if (curDistance > 0) {
    if (afterCollision && curDistance < prevDistance) {
      console.log('发力')
      setTimeout(() => {
        const v = ballBody.getLinearVelocity()
        v.op_mul(-1.2)
        v.setY(v.x() + random(1.5, 5.5, true))
        ballBody.setLinearVelocity(v)
      }, 500)
      afterCollision = false
    }
    return
  }

  afterCollision = true
  console.log('碰撞', getBallAndFloorDistance())
}

/** 检测是否处于可击打状态 */
function checkHitStatus() {
  curDistance = getBallAndFloorDistance()

  if (curDistance > 0) {
    return
  }

  if (falled) {
    canHit = false
    return
  }

  falled = true
}

function initObject() {
  initRoom()
  const ballTexture = new TextureLoader().load(ballTextureUrl)
  const ballBump = new TextureLoader().load(ballBumpUrl)
  ball = new Mesh(
    new SphereGeometry(BALL_RADIUS, 32, 32),
    new MeshPhongMaterial({ side: DoubleSide, map: ballTexture, bumpMap: ballBump, bumpScale: 0.05, })
  )
  /** 球体本地坐标系(红色代表 X 轴. 绿色代表 Y 轴. 蓝色代表 Z 轴. )*/
  const ballAxes = new AxesHelper(BALL_RADIUS * 2)
  const ballShape = new Ammo.btSphereShape( BALL_RADIUS )
  // (ballAxes.material as LineBasicMaterial).linewidth = 3 // NOTICE: 由于OpenGL Core Profile与 大多数平台上WebGL渲染器的限制，无论如何设置该值，线宽始终为1。https://threejs.org/docs/?q=LineBasicMaterial#api/zh/materials/LineBasicMaterial.linewidth
  ballShape.setMargin(MARGIN)
  ball.position.set(0, -4, 8)
  ball.castShadow = true
  ball.add(ballAxes)
  box = new Mesh(
    new BoxGeometry(1, 1, 1),
    new MeshPhongMaterial({ color: 0xFF4A26 })
  )
  box.position.set(-8, 0, -5)
  const boxShape = new Ammo.btBoxShape(new Ammo.btVector3(1 * 0.5, 1 * 0.5, 1 * 0.5))
  boxShape.setMargin(MARGIN)
  box.castShadow = true

  createRigidBody(ball, ballShape, 0.5, ball.position, ball.quaternion, (ballBody) => {
    ballBody.setRestitution(0.85) // 碰撞后补偿系数，系数越大越容易反弹
    ballBody.setDamping(0.1, 0.3) // 设置线速度和角速度相关的阻尼系数
    // ballBody.setLinearVelocity(
    //   new Ammo.btVector3(3, -5, -12)
    // )
    console.log(ballBody)
  })
  createRigidBody(box, boxShape, 10, box.position, box.quaternion)
}

/**
 * 获取一球面的击打位置，确保击打位置永远在正面
 * @param hitDirection 击打方向，即力的z轴方向
 */
function getBallHitPosition(hitDirection: -1 | 1) {
  const phi = random(0, Math.PI * 2, true) // 0 ~ 2π（xy平面）
  const theta = hitDirection === 1 ? random(Math.PI * 0.5, Math.PI, true) : random(0, Math.PI * 0.5) // 0 ~ π
  const x = BALL_RADIUS * Math.sin(theta) * Math.cos(phi)
  const y = BALL_RADIUS * Math.sin(theta) * Math.sin(phi)
  const z = BALL_RADIUS * Math.cos(theta)
  const hitPos = new Vector3(x, y, z) // 这里得到的是球在初始状态下的坐标位置（即未发生旋转时正面的某个位置）
  hitPos.applyQuaternion(ball.quaternion.clone().conjugate()) // 通过逆变换旋转状态，可以把初始状态下的坐标变换到当前旋转状态下的正面

  return hitPos
}

function hitBall(ballBody: any) {
  if (!canHit) {
    return
  }

  const hitDirection = ball.position.z > 0 ? -1 : 1
  const directionForce = random(160, 230, true) * hitDirection
  const hitPos = getBallHitPosition(hitDirection)

  // 正确的击打位置应该是面对方向的某个半球区域的表面点，可以结合物体的旋转姿态来获取正确的点
  // void applyForce([Const, Ref] btVector3 force, [Const, Ref] btVector3 rel_pos);
  ballBody.applyForce(new Ammo.btVector3(
    random(-30, 30, true),
    random(20, 80, true),
    directionForce
  ), new Ammo.btVector3(
    hitPos.x,
    hitPos.y,
    hitPos.z
  ))
  canHit = false
}

function hitTest(userAcceleration: CommonInput['userAcceleration'], customOrientation: CommonInput['customOrientation']) {
  prevHitTime = Date.now()
  const ballBody = ball.userData.physicsBody
  // 将加速度转为世界坐标系（固定视角）下的力
  // 目前情况下基于坐标系的转换误差有点大，可以假设所有的击打都是基于当前设备的朝向方向，然后获取一下加速度计的强度，基于朝向和强度构建一个力？（感觉朝向的数据还是相对准确的？）
  // FIXME: 有些朝向好像有点偏，主要是z轴（世界坐标系），y轴的朝下完全不起作用；
  const basicDir = new Vector3(0, 1, 0)
  const eular = new Euler(
    degToRad(Number(customOrientation.alpha)),
    degToRad(Number(customOrientation.beta)),
    degToRad(-Number(customOrientation.gamma)),  // 因为发现X轴跟实际相反，所以取负
    'ZXY'
  )
  const acc = new Vector3(userAcceleration.x, userAcceleration.y, userAcceleration.z)
  basicDir.applyEuler(eular)
  forceArrow.setDirection(basicDir)
  basicDir.normalize().multiplyScalar(acc.length())

  const force = new Ammo.btVector3(
    basicDir.x * 9.8 * 5,
    basicDir.y * 9.8 * 5,
    basicDir.z * 9.8 * 5
  )

  ballBody.applyCentralForce(force)
}

async function resetBall(ballBody: any) {
  ballBody.applyCentralForce(new Ammo.btVector3(
    0,
    random(60, 150, true),
    0
  )) // 向上抛起

  canHit = true
  falled = false

  console.log('reset')

  await promiseTimeout(200)

  hitBall(ballBody)
}

function initEvent() {
  window.addEventListener('keyup', e => {
    const ballBody = ball.userData.physicsBody
    const boxBody = box.userData.physicsBody
    const motionState = boxBody.getMotionState()
    motionState.getWorldTransform(transformAux1)
    const boxOrigin = transformAux1.getOrigin()

    switch(e.code) {
    case 'Space':
      hitBall(ballBody)
      break
    case 'KeyR':
      resetBall(ballBody)
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

  /**
   * 击打动作检测
   * 
   * 一个典型的击打动作就是一次加速然后减速接近为0的过程；对应到加速度曲线就是（以击打方向为正）先加速度增长然后降为负向的，有点类似于sin曲线的一个周期。
   */
  rightEvent.addEventListener('sensor-input', e => {
    const { detail: { userAcceleration, customOrientation } } = e as CustomEvent<CommonInput>
    if (!userAcceleration) {
      return
    }

    const curTime = Date.now()
    // 确保两次击打之间的间隔不要太近，同时也会过滤掉击打时加速度过大而导致的误认为击打（因为加速度下降后也会超过阈值，导致连续击打）的情况
    if (curTime - prevHitTime < MIN_HIT_DURATION) {
      return
    }

    const curAcc = new Vector3(userAcceleration.x, userAcceleration.y, userAcceleration.z)

    const curLen = curAcc.length()
    const prevLen = prevAcc.length()

    if (prevLen - curLen > 0.6 && prevLen > 3) {
      hitTest(userAcceleration, customOrientation)
      prevAcc.set(0, 0, 0)
    }

    if (curLen > prevLen) {
      prevAcc = curAcc
    }
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
  /** 转动惯量 */
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

  // 没有质量不参与刚体运动，但是会有碰撞
  if (mass > 0) {
    rigidBodies.push(object)
    // Disable deactivation
    // NOTICE: 在刚体运动中，deactivation（去活化）是指在物理引擎中将不再移动的刚体（静止的刚体）从计算中排除的过程。当一个刚体保持静止时，它不需要被计算，因此去除这些刚体可以减少计算开销，提高性能。物理引擎通常通过检查静止刚体的速度和加速度来判断是否需要去活化刚体。如果静止刚体的速度和加速度都很小，那么它们就可以被去活化，直到它们再次受到力或者碰撞等事件的影响而发生运动。(chatGPT)
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
  // initCollisionCallback()
  loop()
})
</script>
