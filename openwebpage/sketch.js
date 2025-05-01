let x = 100;
let y = 100;
let w = 200;
let h = 100;

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  // 绘制矩形
  fill(0, 255, 0);
  rect(x, y, w, h);
}

function mousePressed() {
  // 检查鼠标点击是否在矩形区域内
  if (mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h) {
    // 打开链接并尝试关闭当前页面
    window.open('http://lunafeng922.github.io/ims-2025-Luna/ims-W3-luna/index.html');
    window.close();
  }
}

function keyPressed() {
  // 如果按下 'F' 键，切换全屏模式
  if (key === 'F' || key === 'f') {
    let fs = fullscreen();
    fullscreen(!fs);  // 切换全屏模式
  }
}
