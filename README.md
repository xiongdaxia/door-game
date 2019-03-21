READEME
===========================
该项目是一个富有创意、情怀的小游戏，游戏逻辑：寻找钥匙，打开门

## 学习后的成长
* 原生canvas写H5游戏的基本套路
* 脱离框架从实战的角度 理解 编写可维护、可扩展的JS
* 罕见的撩妹套路、单身狗收藏下～
* 脱离业务，探索前端真正的乐趣

## 阅读须知
前置技能 ： 熟悉canvas的基本API和一定的JS基础

温故知新 ：常用的canvas API

```js
let canvas = getElementById('canvas');
let ctx = canvas.getContext('2d');
ctx.drawImage(img,x,y,w,h,x1,y1,w1,h1);
ctx.fillText(string,x,y);
ctx.arc(x,y,r,0,Math.PI*2,false);
ctx.clearRect(x,y,w,h);
ctx.fillRec(x,y,w,h);
ctx.scale(x,y);
ctx.translate(x,y);
ctx.rotate(n);
ctx.save();
ctx.restore();
ctx.clip();
ctx.stroke();
ctx.fill();
window.requestAnimationFrame();
```
## 游戏逻辑流程图


### 开发中遇到的问题
1 椭圆的绘制
  使用画圆 + 坐标放大缩小
```js
```
2 动画闪屏
  使用离屏canvas充当缓冲区，避免clear操作引起的闪屏
3 异步加载图片
  使用promise.all异步处理
```js
```  
4 人物抖动特效的实现
  参考源码实现
  
5 动画性能优化（一点思考🤔）
  * 使用requestAnimationFrame
  * 利用剪辑区域调出变化的部分处理，切忌整个canvas重绘
  * 利用离屏canvas充当缓冲区，把需要重复绘制的部分缓存起来，减少API的消耗
  * 尽量利用CSS，背景大图可以用CSS的就别用canvas画出来
  * 尽量不要在循环中使用耗时的API，如drawImage、putImageData
  * 避免浮点数的运算，当数过小的时候，手动置0


