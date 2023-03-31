[TOC]



## 关于

利用`joy-con`和[WebHID API](https://wicg.github.io/webhid/)尝试做一些有意思的交互；这里正好有人封装了一个基于`WebHID API`来连接`joy-con`设备的库：

- [tomayac/joy-con-webhid: Use the Nintendo Switch Joy-Cons via the WebHID API](https://github.com/tomayac/joy-con-webhid)

关于如何在电脑上用蓝牙连接`joy-con`设备，可以参考这个教程：

- [joycon 手柄连接电脑教程 - 哔哩哔哩](https://www.bilibili.com/read/cv10678893?from=search)

只要`joy-con`设备能被电脑蓝牙识别连接，后续打开`joy-con`就能自动连接到电脑蓝牙；



## joy-con-webhid 库的一些用法

由于`joy-con-webhid`作者并没有提供直接的`API`文档，不过好在源码代码和注释写的很清晰，可以**直接看源码**来参考使用方法；

### 坑

- 在使用`pnpm`安装该包，发现其打包的`dist`目录缺失了一些文件，所以不能直接使用；不过可以复制其`src`目录文件作为模块使用，因为其源码并不包含第三方包；

  <img src="http://pic.xiexuefeng.cc/markdown/image-20221209161906306.png?imageslim" alt="image-20221209161906306" style="zoom:50%;" />

  <img src="http://pic.xiexuefeng.cc/markdown/image-20221209162042204.png?imageslim" alt="image-20221209162042204" style="zoom:50%;" />

- 

### hidinput 事件

该事件为`HID`设备传送数据的事件，当`HID`设备（即`joycon`手柄）发生**状态变化**时（如按钮触发，`IMU`传感器数据变化等）会触发该事件，利用该事件的数据就可以进一步判断当前的输入；

该事件是一个`CustomEvent`，其`detail`字段主要的包含的数据如下（完整数据可以参考源码[^1]）：

```typescript
/** 主要输入数据 */
interface CommonInput {
  /** 平滑后（三个原始采样数据平均）的加速度计数据 */
  actualAccelerometer: CommonVector
  /**
   * 平滑后的陀螺仪数据
   * https://learn.sparkfun.com/tutorials/gyroscope/all
   */
  actualGyroscope: {
    /** degrees per second (°/s)  */
    dps: CommonVector
    /** revolutions per second */
    rps: CommonVector
  }
  /** 平滑后的设备朝向数据 */
  actualOrientation: CommonQuaternion
  actualOrientationQuaternion: CommonQuaternion
  quaternion: Quaternion
}
```

由于左右两个`joycon`的按钮功能不同，所以专门用来记录按钮按压状态的`buttonStatus`字段根据左右各不相同，如：

```typescript
/** left joy-con 按钮状态；key为按钮名称，value为是否处于按压 */
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

/** left joy-con 输入数据 */
export interface LeftInput extends CommonInput {
  /** 按钮状态 */
  buttonStatus: LeftButtonStatus
}
```



#### joycon 加速度计轴

![alt text](http://pic.xiexuefeng.cc/markdown/687474703a2f2f6374636165722e636f6d2f7769692f7377697463682f6a6f79636f6e5f6163632d6779726f5f6c656674322e706e67.png?imageslim)

![alt text](http://pic.xiexuefeng.cc/markdown/687474703a2f2f6374636165722e636f6d2f7769692f7377697463682f6a6f79636f6e5f6163632d6779726f5f7269676874322e706e67.png?imageslim)

如图[^6]所示，`joycon`加速度计的轴遵循上面的右手定则分布；



#### 加速度计的重力影响

由于`joycon`的加速度计本身并没有消除重力影响，因此正常的读数会受重力的影响；

<img src="http://pic.xiexuefeng.cc/markdown/image-20230319192935562.png?imageslim" alt="image-20230319192935562" style="zoom:50%;" />

上图就是右手柄在**正面朝上**的静止状态下测量的加速度读数，可以看到在$-z$方向有一个`g`的力，但实际上根据加速度计的轴分布，按理说重力应该作用在$+z$轴上？不过这里应该是加速度计的原理导致的，毕竟静止状态合力应该为`0`，因此加速度计的内部实际上有一个`-g`的力？



#### actualOrientation

可以推断这里的数据应该类似于[RelativeOrientationSensor](https://developer.mozilla.org/en-US/docs/Web/API/RelativeOrientationSensor)（理由就是实测设备旋转后静止数据会回归初始状态，因此应该不是一个绝对的朝向），是一种设备朝向的旋转数据，三个分量应该就是欧拉角，从库的实例源码[^2]可以得知欧拉角的顺序为$(z, x, y)$；

- [如何通俗地解释欧拉角？之后为何要引入四元数？ - 大脸怪的回答 - 知乎](https://www.zhihu.com/question/47736315/answer/236808639)：比较详细的讲解了欧拉角和四元数的区别，以及各种欧拉角和四元数的基本性质等

### rumble

这是一个封装了向`joycon`发送震动指令的方法：

<img src="http://pic.xiexuefeng.cc/markdown/image-20221212165040437.png?imageslim" alt="image-20221212165040437" style="zoom:50%;" />



### 关于传感器噪声

由于`IMU`传感器本身就有各种噪声，因此需要知道该库传出的传感器数据是否为校准过的，以便后续的数据处理；从[源码](https://github.com/tomayac/joy-con-webhid/blob/518a5d34d585e1844b6daf42310b975ab2631835/src/parse.js#L145)可以看出，该库本身只是对原始数据进行了还原[^5]，并没有进行校准；

不过仔细查看其借鉴的`joycon`逆向工程留下的[文档](https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/master/imu_sensor_notes.md)可以发现里面提供了传感器相关的噪声范围以及相应的校准公式，值得参考；



## 操作识别

### 布尔按钮

根据`joycon`的设计可知，除了摇杆以外的按钮都是一个布尔状态；不过实际中使用的时候直接用按钮的布尔状态实在是不太方便，因此这里可以参照`DOM`为键盘设计的事件，将按键按压过程分为`keydown`、`keypress`和`keyup`三个阶段：

```mermaid
graph LR;
	A[按钮状态: false];
	B[按钮状态: true];
	A --> keydown --> B --> keypress --> keyup --> A;
```

这里只需要记录上一个`hidinput`当中的每个按钮的状态，然后在当前`hidinput`事件处理时对比一下之前的按钮状态即可完成上述三种事件的转化；



### 摇杆

#### 精确方向



#### 轴方向



### 体感控制

#### 固定方向晃动





### 特定手势



#### 基于机器学习/神经网络的方法

- [(PDF) Gesture Recognition with a Wii Controller](https://www.researchgate.net/publication/30012906_Gesture_Recognition_with_a_Wii_Controller)：基于机器学习的思路对加速度传感器数据进行筛选、分类，最终得到一个最接近的手势；





#### 基于余弦相似度的方法[^3]

1. 记录特定手势从开始到结束动作期间的传感器数据；
2. 可以对上述传感器数据做一个**固定数量**的采样（相同数量的样本数据方便进行计算）；
3. 对用户实时动作数据（从开始到结束期间）进行同样的采样，然后使用余弦相似度计算方法匹配各个预先记录的特定手势，查看最接近的相似度以及相似度是否足够高（因为可能不匹配任何手势的数据）；



#### 如何从一段持续的传感器数据中匹配手势数据？

特征提取？

- [（超详细）语音信号处理之特征提取_BarbaraChow的博客-CSDN博客_语音信号特征提取](https://blog.csdn.net/qq_36002089/article/details/126849445)

或者简单的设置起始点阈值？



### IK

- [【游戏开发】逆向运动学（IK）详解 - 知乎](https://zhuanlan.zhihu.com/p/499405167)



## Ammo.js

### 模块化引用

由于`ammo.js`并没有直接提供`npm`模块，只能直接引入其[打包文件](https://github.com/kripken/ammo.js/tree/main/builds)；不过很明显，其输出文件不满足`ESM`规范，因为其没有暴露`default`成员，其次里面用到了一些非严格模式下的语法；

虽然可以看到里面输出了`wasm`文件，但是这个`wasm`文件不能直接单独引入，否则会报错[^4]；必须要配合`ammo.wasm.js`文件进行使用，即引入`ammo.wasm.js`文件即可自动加载wasm模块，不过由于`ammo.wasm.js`文件本身加载的`wasm`文件是一个相对地址，因此最好将其地址设为一个根目录下的绝对地址，不然无法正确加载`wasm`文件；



### 方法定义

关于`Ammo`暴露的方法可以参考[ammo.js/ammo.idl at main · kripken/ammo.js](https://github.com/kripken/ammo.js/blob/main/ammo.idl)；具体的使用方法问下`chatGPT`也是不错的。

<img src="http://pic.xiexuefeng.cc/markdown/image-20230331154007913.png?imageslim" alt="image-20230331154007913" style="zoom:50%;" />



## 资源

### 纹理

- [Free Textures for Basketball, Beach Ball, Pool Balls, Softball, and Tennis Balls.](https://www.robinwood.com/Catalog/FreeStuff/Textures/TexturePages/BallMaps.html)：一些球类的免费纹理贴图



## 相关

[redphx/joydance: Use Joy-Cons to play Ubisoft's Just Dance on all platforms](https://github.com/redphx/joydance)：一个基于python的库，原理也是利用HID协议连接joycon获取其数据，并转发到舞力全开软件





[^1]: [joy-con-webhid/parse.js at main · tomayac/joy-con-webhid](https://github.com/tomayac/joy-con-webhid/blob/main/src/parse.js)
[^2]: https://github.com/tomayac/joy-con-webhid/blob/518a5d34d585e1844b6daf42310b975ab2631835/demo/style.css#L112
[^3]: [推荐算法入门（1）相似度计算方法大全 - 知乎](https://zhuanlan.zhihu.com/p/33164335)
[^4]: [TypeError: WebAssembly.instantiate():Import #0 module="a" error :module is not an object or function · Issue #15853 · emscripten-core/emscripten](https://github.com/emscripten-core/emscripten/issues/15853)
[^5]: https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/master/imu_sensor_notes.md#accelerometer---acceleration-in-g
[^6]: https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/master/imu_sensor_notes.md#axes-definition
