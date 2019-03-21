// 获得场景一的canvas元素
let canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 取窗口的 X Y 中间位置
let cx = window.innerWidth / 2;
let cy = window.innerHeight / 2;

// 场景一的页面信息
window.FIRST_SENCE = {
  canvas: document.getElementById('canvas'),
  player: { x: cx - 150, y: cy - 30 },
  door: { x: cx + 150, y: cy - 30 },
  key: { x: cx, y: cy + 125 },
  circles: [{ x: cx, y: cy, radius: 120, invisible: true }]
};

// 场景二的页面信息
window.SECOND_SENCE = [
  // I
  {
    canvas: document.getElementById('canvas_1'), // canvas DOM
    player: { x: 150, y: 175 }, // 人的位置
    door: { x: 150, y: 75 }, // 门
    key: { x: 150, y: 275 }, // 钥匙
    circles: [{ x: 0, y: 150, radius: 100 }, { x: 300, y: 150, radius: 100 }], // 游戏场景中的圆
    countdown: 90 // 游戏时间时长
  },
  // Heart
  {
    canvas: document.getElementById('canvas_2'),
    player: { x: 150, y: 250 },
    door: { x: 150, y: 249 },
    key: { x: 150, y: 75 },
    circles: [
      { x: 100, y: 100, radius: 50 },
      { x: 200, y: 100, radius: 50 },
      { x: 150, y: 100, radius: 10, invisible: true },
      { x: 0, y: 300, radius: 145 },
      { x: 300, y: 300, radius: 145 }
    ],
    countdown: 200
  },
  // U
  {
    canvas: document.getElementById('canvas_3'),
    player: { x: 30, y: 75 },
    door: { x: 270, y: 75 },
    key: { x: 150, y: 270 },
    circles: [{ x: 150, y: 150, radius: 115 }],
    countdown: 130
  }
];

// 重放
let rewindFrame = 0; // 重放的Frame计数器
let rewindLevel = null; // 场景二中的重放游戏场景

// 记录场景
let levelObjects = []; // 记录场景二的游戏信息
let CURRENT_LEVEL = 0; // 记录场景二游戏信息对应的index

// 加载所有的图片
let images = [];

/*
 * 1 场景一
 * 2 场景二
 * 3 回放路径
 * 4 画回放路线
 * 5 I HEART U
 */
let STAGE = 1;

// 生成场景一
window.sence = new Scene(window.FIRST_SENCE, true);

// 用setTimeout可以控制数据更新的时间间隔，从而控制人物的移动速度
setInterval(update, 1000 / 30);
// 动画

async function Animation() {
  if (!images.length) {
    images = await allImgLoad();
  }
  window.requestAnimationFrame(Animation);
  render();
}
Animation();

// 更新
function update() {
  // 如果是场景一或者二
  if (STAGE === 1 || STAGE === 2) {
    if (sence) {
      sence.update();
    }
  }
}

// 渲染
function render() {
  if (STAGE === 1 || STAGE === 2) {
    // 如果是场景一或者场景二
    if (sence) {
      sence.draw();
    }
  } else if (STAGE === 3) {
    // 如果是回放
    rewindLevel.playbackFrame(rewindFrame);
    rewindFrame--;
    if (rewindFrame < 0) {
      CURRENT_LEVEL--;
      if (CURRENT_LEVEL >= 0) {
        startRewind();
      } else {
        // 开始画走过的路线
        STAGE = 4;
        CURRENT_LEVEL = 0;
        startPlayback();
        document.getElementById('rewind_text').style.display = 'none';
        document.getElementById('replay_text').style.display = 'block';
      }
    }
  } else if (STAGE === 4) {
    rewindLevel.playbackFrame(rewindFrame);
    rewindFrame++;
    if (rewindFrame >= rewindLevel.frames.length) {
      CURRENT_LEVEL++;
      if (CURRENT_LEVEL < 3) {
        startPlayback();
      } else {
        document.getElementById('replay_text').style.display = 'none';
        iHeartYou();
        STAGE = 5;
      }
    }
  }
}

// 场景
function Scene(config, isBegin) {
  let self = this;
  self.circles = config.circles;
  // 是否是开始的场景
  self.isBegin = isBegin;
  // 钥匙是否被拾取
  self.keyCollected = false;

  self.player = new People(config.player, self);
  self.key = new Key(config.key, self);
  self.door = new Door(config.door, self);
  if (config.countdown) {
    self.clock = new Clock(config.countdown, self);
  }

  // 线
  self.drawPathLastPoint = null;

  self.canvas = config.canvas;
  self.ctx = self.canvas.getContext('2d');
  self.width = self.canvas.width;

  self.height = self.isBegin ? self.canvas.height : self.canvas.height - 80;

  // 记录路径的离屏canvas
  self.pathCanvas = document.createElement('canvas');
  self.pathCanvas.width = self.width;
  self.pathCanvas.height = self.height;
  self.pathContext = self.pathCanvas.getContext('2d');
  self.DRAW_PATH = false;

  // 更新
  self.update = function() {
    self.player.update();
    self.key.update();
    let output = self.door.update();
    if (!self.isBegin) {
      if (output === 'END') {
        self.ctx.clearRect(0, self.height, self.canvas.width, 80);
      } else {
        self.clock.update();
      }
      self.recordFrame();
    }
  };

  // 画
  self.draw = function() {
    let ctx = self.ctx;

    // 如果是场景一 将绘画环境放大
    if (self.isBegin) {
      ctx.save();
      let introScale = 1.5;
      ctx.scale(introScale, introScale);
      ctx.translate(-self.width / 2, -self.height / 2);
      ctx.translate(self.width / 2 / introScale, self.height / 2 / introScale);
    }

    // 单独clear运动中的元素，提高动画效率
    if (self.isBegin) {
      ctx.clearRect(self.player.x - 100, self.player.y - 100, 200, 200);
      ctx.clearRect(self.key.x - 100, self.key.y - 100, 200, 200);
      ctx.clearRect(self.door.x - 100, self.door.y - 100, 200, 200);
    } else {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, self.width, self.height);
    }

    // 画各个元素的阴影
    let objects = [self.player, self.key, self.door];
    for (let i = 0; i < objects.length; i++) {
      objects[i].drawShadow(ctx);
    }

    // 画圆
    ctx.fillStyle = '#333';
    for (let i = 0; i < self.circles.length; i++) {
      let c = self.circles[i];
      if (c.invisible) continue;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2, false);
      ctx.fill();
    }

    // 按照Y值排序，使人进门过程中有深度
    objects.sort(function(a, b) {
      return a.y - b.y;
    });
    for (let i = 0; i < objects.length; i++) {
      objects[i].draw(ctx);
    }

    // 画时钟
    if (!self.isBegin) {
      ctx.clearRect(0, self.height, self.canvas.width, 80);
      if (!self.NO_CLOCK) self.clock.draw(ctx);
    }

    // 画路径
    if (self.DRAW_PATH) {
      ctx.drawImage(self.pathCanvas, 0, 0);

      if (!self.drawPathLastPoint) {
        self.drawPathLastPoint = {
          x: self.player.x - 0.1,
          y: self.player.y
        };
      }
      let pctx = self.pathContext;
      pctx.beginPath();
      pctx.strokeStyle = '#cc2727';
      pctx.lineWidth = 10;
      pctx.lineCap = 'round';
      pctx.lineJoin = 'round';
      pctx.moveTo(self.drawPathLastPoint.x, self.drawPathLastPoint.y);
      pctx.lineTo(self.player.x, self.player.y);
      pctx.stroke();

      self.drawPathLastPoint = {
        x: self.player.x,
        y: self.player.y
      };
    }
    ctx.restore();
  };

  // 记录路径
  self.frames = [];
  self.recordFrame = function() {
    let frame = {
      player: {
        x: self.player.x,
        y: self.player.y,
        sway: self.player.sway,
        bounce: self.player.bounce,
        frame: self.player.frame,
        direction: self.player.direction
      },
      key: {
        hover: self.key.hover
      },
      door: {
        frame: self.door.frame
      },
      keyCollected: self.keyCollected
    };

    self.frames.push(frame);
  };

  // 回放
  self.playbackFrame = function(frameIndex) {
    let frame = self.frames[frameIndex];

    self.player.x = frame.player.x;
    self.player.y = frame.player.y;
    self.player.sway = frame.player.sway;
    self.player.bounce = frame.player.bounce;
    self.player.frame = frame.player.frame;
    self.player.direction = frame.player.direction;

    self.key.hover = frame.key.hover;
    self.door.frame = frame.door.frame;

    self.keyCollected = frame.keyCollected;

    self.NO_CLOCK = true;
    self.draw();
  };

  // 清理
  self.clear = function() {
    let ctx = self.ctx;
    ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
  };

  self.onlyPath = function() {
    self.clear();
    self.ctx.drawImage(self.pathCanvas, 0, 0);
  };
}

// 人
function People(config, sence) {
  let self = this;

  self.x = config.x;
  self.y = config.y;
  // 人移动的速度
  self.vel = { x: 0, y: 0 };
  // 人的帧数
  self.frame = 0;
  // 向左还是向右移动
  self.direction = 1;

  // 抖动值
  self.bounce = 1;
  let bounceVel = 0;
  // 摇摆值
  self.sway = 0;
  let swayVel = 0;
  // 抖动数组
  let bouncy = [0.0, 0.25, 1.0, 0.9, 0.0, 0.0, 0.25, 1.0, 0.9, 0.0];

  self.update = function() {
    let dx = 0;
    let dy = 0;

    if (keyCode.left) dx -= 1;
    if (keyCode.right) dx += 1;
    if (keyCode.up) dy -= 1;
    if (keyCode.down) dy += 1;

    let dd = Math.sqrt(dx * dx + dy * dy);

    if (dd > 0) {
      self.vel.x += (dx / dd) * 2;
      self.vel.y += (dy / dd) * 2;
    }

    if (keyCode.left) self.direction = -1;
    if (keyCode.right) self.direction = 1;

    if (keyCode.left || keyCode.right || keyCode.up || keyCode.down) {
      self.frame++;
      if (self.frame > 9) self.frame = 1;
    } else {
      if (self.frame > 0) self.bounce = 0.8;
      self.frame = 0;
    }

    self.x += self.vel.x;
    self.y += self.vel.y;
    // 速度是慢慢变成0的
    self.vel.x *= 0.7;
    self.vel.y *= 0.7;

    // 触碰到游戏边界的情况
    if (self.x < 0) self.x = 0;
    if (self.y < 0) self.y = 0;
    if (self.x > sence.width) self.x = sence.width;
    if (self.y > sence.height) self.y = sence.height;

    // 触碰到游戏场景中绘制的圆
    for (let i = 0; i < sence.circles.length; i++) {
      let circle = sence.circles[i];

      let dx = self.x - circle.x;
      let dy = self.y - circle.y;

      let distance = Math.sqrt(dx * dx + dy * dy);
      let overlap = circle.radius + 5 - distance;

      if (overlap > 0) {
        let ux = dx / distance;
        let uy = dy / distance;
        let pushX = ux * overlap;
        let pushY = uy * overlap;
        self.x += pushX;
        self.y += pushY;
      }
    }

    // 抖动和摇摆
    // y = y + x;
    // x = x + (-Vx * 0.08 - y) * 0.2
    // x = x * 0.9
    self.sway += swayVel;
    swayVel += (-self.vel.x * 0.08 - self.sway) * 0.2;
    swayVel *= 0.9;
    // 测试使用
    function test(self) {
      this.selfSway = self.sway;
      this.swayVel = swayVel;
      this.Vx = self.vel.x;
    }
    let HHH = new test(self);
    if (HHH.Vx !== 0) {
      console.table(HHH);
    }

    // y =  y + x;
    // x = x + (1-y)*0.2
    // x = x * 0.9
    self.bounce += bounceVel;
    bounceVel += (1 - self.bounce) * 0.2;
    bounceVel *= 0.9;
  };
  // 画people
  self.draw = function(ctx) {
    let x = self.x;
    let y = self.y;

    y += -6 * bouncy[self.frame];

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(0.5, 0.5);

    ctx.rotate(self.sway);
    ctx.scale(self.direction, 1);
    ctx.scale(1 / self.bounce, self.bounce);
    ctx.drawImage(images[3], -25, -100, 50, 100);
    ctx.restore();
  };
  // 画people脚下的阴影
  self.drawShadow = function(ctx) {
    let x = self.x;
    let y = self.y;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(0.5, 0.5);

    let scale = (3 - bouncy[self.frame]) / 3;
    ctx.scale(1 * scale, 0.3 * scale);
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2, false);
    ctx.fillStyle = 'rgba(100,100,100,0.4)';
    ctx.fill();
    ctx.restore();
  };
}

// 钥匙
function Key(config, sence) {
  let self = this;

  self.x = config.x;
  self.y = config.y;
  // 通过hover的值来产生钥匙悬浮和阴影的效果
  self.hover = 0;
  // 更新钥匙的数据
  self.update = function() {
    // 如果钥匙已被拾取
    if (sence.keyCollected) return;
    self.hover += 0.07;
    // 通过计算钥匙和人的距离来判断是否拾到钥匙
    let dx = self.x - sence.player.x;
    let dy = self.y - sence.player.y;
    let distance = Math.sqrt((dx * dx) / 4 + dy * dy);
    if (distance < 5) {
      sence.keyCollected = true;
    }
  };
  // 绘画钥匙
  self.draw = function(ctx) {
    if (sence.keyCollected) return;
    ctx.save();
    // 钥匙的y轴通过一个sin值来上下浮动
    ctx.translate(self.x, self.y - 20 - Math.sin(self.hover) * 5);
    ctx.scale(0.7, 0.7);
    ctx.drawImage(images[2], -23, -14, 47, 28);
    ctx.restore();
  };
  // 画钥匙下的阴影
  self.drawShadow = function(ctx) {
    if (sence.keyCollected) return;

    ctx.save();
    ctx.translate(self.x, self.y);
    ctx.scale(0.7, 0.7);

    let scale = 1 - Math.sin(self.hover) * 0.5;
    ctx.scale(1 * scale, 0.3 * scale);
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2, false);
    ctx.fillStyle = 'rgba(100,100,100,0.4)';
    ctx.fill();
    ctx.restore();
  };
}

// 门
function Door(config, sence) {
  let self = this;

  self.x = config.x;
  self.y = config.y;
  // 记录一个帧率来画开门的动画
  self.frame = 0;

  self.update = function() {
    // 如果钥匙被拾取，并且帧数小于10
    if (sence.keyCollected && self.frame < 10) {
      self.frame += 0.5;
    }
    // 如果钥匙被找到
    if (sence.keyCollected) {
      let dx = self.x - sence.player.x;
      let dy = self.y - sence.player.y;
      let distance = Math.sqrt((dx * dx) / 25 + dy * dy);
      if (distance < 6) {
        if (sence.isBegin) {
          document.getElementById('whole_container').style.top = '-100%';
          // 依次引入场景二的canvas
          CURRENT_LEVEL = 0;
          let seconedScene = new Scene(SECOND_SENCE[CURRENT_LEVEL]);
          levelObjects[CURRENT_LEVEL] = seconedScene;
          // 清空第一张图
          window.sence = null;
          setTimeout(() => {
            window.sence = seconedScene;
          }, 1200);
          return 'END';
        } else {
          next();
          return 'END';
        }
      }
    }
  };

  self.draw = function(ctx) {
    ctx.save();
    ctx.translate(self.x, self.y);
    ctx.scale(0.7, 0.7);
    // 通过frame去切割图片绘制
    let f = Math.floor(self.frame);
    let sw = 68;
    let sh = 96;
    let sx = (f * sw) % images[1].width;
    let sy = sh * Math.floor((f * sw) / images[1].width);
    let dx = -34;
    let dy = -91;
    ctx.drawImage(images[1], sx, sy, sw, sh, dx, dy, sw, sh);
    ctx.restore();
  };
  // 画门的阴影
  self.drawShadow = function(ctx) {
    ctx.save();
    ctx.translate(self.x, self.y);
    ctx.scale(0.7, 0.7);
    ctx.scale(1, 0.2);
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2, false);
    ctx.fillStyle = 'rgba(100,100,100,0.4)';
    ctx.fill();
    ctx.restore();
  };
}

// 时钟
function Clock(countdown, sence) {
  let self = this;

  self.framePerTick = 30 / countdown;
  self.frame = 0;

  self.update = function() {
    // Normal update
    self.frame += self.framePerTick;
    if (self.frame >= 30) {
      reset();
    }
  };

  self.draw = function(ctx) {
    ctx.save();
    ctx.translate(sence.width / 2, sence.height + 40);
    let f = Math.floor(self.frame);
    let sw = 82;
    let sh = 82;
    let sx = (f * sw) % images[4].width;
    let sy = sh * Math.floor((f * sw) / images[4].width);
    ctx.drawImage(images[4], sx, sy, sw, sh, -30, -30, 60, 60);
    ctx.restore();
  };
}

// 加载单张图片
function imgLoad(imgName) {
  let img = new Image();
  img.src = './imge/' + imgName;
  return new Promise(resolve => {
    img.onload = function() {
      resolve(img);
    };
  });
}

// 加载所有图片
function allImgLoad() {
  let imgNameList = ['bg.png', 'door.png', 'key.png', 'peop.png', 'clock.png'];
  imgNameList.map(item => {
    return imgLoad(item);
  });
  return Promise.all(
    imgNameList.map(item => {
      return imgLoad(item);
    })
  );
}

// 开始回放
function startRewind() {
  rewindLevel = levelObjects[CURRENT_LEVEL];
  rewindFrame = rewindLevel.frames.length - 1;
}

// 开始绘画路径
function startPlayback() {
  rewindLevel = levelObjects[CURRENT_LEVEL];
  rewindLevel.DRAW_PATH = true;
  rewindFrame = 0;
}

// 当时钟转完后，重置画布
function reset() {
  let lvl = new Scene(SECOND_SENCE[CURRENT_LEVEL]);
  levelObjects[CURRENT_LEVEL] = lvl;
  if (window.sence) {
    window.sence.clear();
  }
  window.sence = null;
  setTimeout(function() {
    window.sence = lvl;
  }, 500);
}

// 场景二中结束一个场景后，接着另一个场景
function next() {
  CURRENT_LEVEL++;
  // 如果场景二中的游戏没有进行完
  if (CURRENT_LEVEL < SECOND_SENCE.length) {
    let lvl = new Scene(SECOND_SENCE[CURRENT_LEVEL]);
    levelObjects[CURRENT_LEVEL] = lvl;
    window.sence = null;
    setTimeout(function() {
      window.sence = lvl;
    }, 500);
  } else {
    // 场景二中的游戏进行完
    sence = null;
    STAGE = 3;
    CURRENT_LEVEL = 2;
    // 开始回放
    startRewind();
    document.getElementById('rewind_text').style.display = 'block';
  }
}

// I HEART U
function iHeartYou() {
  for (let i = 0; i < levelObjects.length; i++) {
    levelObjects[i].onlyPath();
  }

  document.getElementById('canvas_container').style.backgroundPosition = '0px -390px';
  document.getElementById('screen_two').style.background = '#000';

  let vtext = document.getElementById('valentines_text');
  vtext.style.display = 'block';
  vtext.style.color = 'red';
  vtext.style.fontSize = '50px';
  vtext.textContent = '周末愉快哟～';
}

// 移动方向
let keyCode = {
  up: false,
  down: false,
  left: false,
  right: false
};

// 事件监听
let keyArry = {
  38: 'up',
  87: 'up',
  40: 'down',
  83: 'down',
  37: 'left',
  65: 'left',
  39: 'right',
  68: 'right'
};

// 会往keyCode里加一个undefined
function keydown(e) {
  keyCode[keyArry[e.keyCode]] = true;
}
function keyup(e) {
  keyCode[keyArry[e.keyCode]] = false;
}
window.addEventListener('keydown', keydown, false);
window.addEventListener('keyup', keyup, false);
