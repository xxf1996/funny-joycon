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
