let hasStarted = false;
let startButton;

// Interface
let playButton;
let tempoButtons = [];
let randomPatternButton;
let clearButton;
let bpmValues = [20, 40, 80, 120, 160, 240];

// Sequencer
let timeSignature = [3, 4];
let nMeasures = 3;
function nSteps() {
  return nMeasures * timeSignature[0];
}
let currentStep;

let cells = [];

// Sound
let kit;
let breathTracks = [
  "嘘 - XU",
  "呵 - HE",
  "呼 - HU",
  "嘶 - SI",
  "吹 - CHUI",
  "嘻 - XI",
];
let movementTracks = [
  "拍手 - CLAP",
  "微蹲 - SQUAT",
  "踢腿 - KICK",
  "跺脚 - STAMP",
];
let drumNames = [...breathTracks, ...movementTracks];
let nTracks = drumNames.length;
kit = new Tone.Players({
  "嘘 - XU": "samples/505/XU.MP3",
  "呵 - HE": "samples/505/HE.MP3",
  "呼 - HU": "samples/505/HU.MP3",
  "嘶 - SI": "samples/505/SI.MP3",
  "吹 - CHUI": "samples/505/CHUI.MP3",
  "嘻 - XI": "samples/505/XI.MP3",
  "拍手 - CLAP": "samples/505/hho.mp3",
  "微蹲 - SQUAT": "samples/505/hh.mp3",
  "踢腿 - KICK": "samples/505/snare.mp3",
  "跺脚 - STAMP": "samples/505/kick.mp3",
});
kit.toDestination();
Tone.Transport.scheduleRepeat(onBeat, "4n");

// Graphics
let cellWidth, cellHeight;
let red;
let orange;
let labelWidth = 200;
let bodyScale = 1.0;

// Stay unmoved when stop
let lastPosition = 0;

function preload() {
  clap = loadImage("Clap.PNG");
  squat = loadImage("Squat.PNG");
  kick = loadImage("Kick.PNG");
  stamp = loadImage("Stamp.PNG");
  body = loadImage("Body.png");
}

// Audio playback loop
function onBeat(time) {
  let pos = Tone.Transport.position.split(":");
  let measure = int(pos[0]);
  let beat = int(pos[1]);
  currentStep = (measure * timeSignature[0] + beat) % nSteps();
  for (let track = 0; track < nTracks; track++) {
    if (cells[track][currentStep]) {
      let hh = kit.player(drumNames[track]);
      hh.start(time);
    }
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  updateCanvasSize();

  Tone.Transport.timeSignature = timeSignature;

  // Buttons
  let buttonY = 20;

  playButton = createButton("开始 - PLAY");
  playButton.position(windowWidth - 150, buttonY);
  playButton.mouseClicked(togglePlay);
  buttonY += 40;

  bpmValues.forEach((bpm) => {
    let button = createButton(bpm + " BPM - 拍/分");
    button.position(windowWidth - 150, buttonY);
    button.mouseClicked(() => setTempo(bpm));
    tempoButtons.push(button);
    buttonY += 40;
  });

  randomPatternButton = createButton("随机 - Random");
  randomPatternButton.position(windowWidth - 150, buttonY);
  randomPatternButton.mouseClicked(randomPattern);
  buttonY += 40;

  clearButton = createButton("清空 - Clear All");
  clearButton.position(windowWidth - 150, buttonY);
  clearButton.mouseClicked(clearPattern);

  // 隐藏除 startButton 外的所有按钮
  playButton.hide();
  tempoButtons.forEach((b) => b.hide());
  randomPatternButton.hide();
  clearButton.hide();

  cellWidth =
    (windowWidth - (600 / 1400) * windowWidth - labelWidth) / nSteps();
  cellHeight = windowHeight / nTracks;

  red = color(255, 0, 0, 60);
  orange = color(255, 100, 0, 60);

  for (let track = 0; track < nTracks; track++) {
    cells[track] = [];
    for (let step = 0; step < nSteps(); step++) {
      cells[track][step] = 0;
    }
  }
  setTimeout(() => {
    updateCanvasSize();
    resizeCanvas(windowWidth, windowHeight);
    repositionButtons();
  }, 100);

  startButton = createButton("Click to Start");
  startButton.position(windowWidth / 2, windowHeight / 1.5);
  startButton.style("font-size", "24px");
  startButton.style("padding", "20px 40px");
  startButton.mousePressed(() => {
    hasStarted = true;
    startButton.hide();
  });

  startButton.mousePressed(() => {
    hasStarted = true;
    startButton.hide();

    playButton.show();
    tempoButtons.forEach((b) => b.show());
    randomPatternButton.show();
    clearButton.show();
  });
}

function draw() {
  if (!hasStarted) {
    textFont("Doto");
    background(255, 240, 160);
    textAlign(CENTER, CENTER);
    textSize(48);
    text("Welcome To Breath Training Room", windowWidth / 2, windowHeight / 2 - 80);
    return;
  }

  background(255, 240, 160, 60);

  //Body & Scale
  if (Tone.Transport.state === "started") {
    let scaleSpeed = Tone.Transport.bpm.value / 120;
    bodyScale = 1.0 + sin(frameCount * 0.16 * scaleSpeed) * 0.1;
  } else {
    bodyScale = 1.0;
  }
  push();
  translate(windowWidth - 300, windowHeight / 2);
  scale(bodyScale);
  image(body, -300, -300, 600, 600);
  pop();

  //lines & frame
  stroke(255, 0, 0, 60);
  strokeWeight(0.5);
  for (let i = 0; i <= nTracks; i++) {
    let y = i * cellHeight;
    line(0, y, windowWidth - 600, y);
  }
  for (let i = 0; i <= nSteps(); i++) {
    let x = labelWidth + i * cellWidth;
    line(x, 0, x, windowHeight);
  }

  //Labels of tracknames
  fill(0);
  textFont("Long Cang");
  textAlign(CENTER, CENTER);
  textSize(30);
  push();
  stroke(255);
  strokeWeight(2);
  for (let track = 0; track < nTracks; track++) {
    text(drumNames[track], labelWidth / 2, track * cellHeight + cellHeight / 2);
  }
  pop();

  //Color of blocks
  for (let track = 0; track < nTracks; track++) {
    for (let step = 0; step < nSteps(); step++) {
      if (cells[track][step]) {
        if (track < breathTracks.length) {
          fill(red);
        } else {
          fill(orange);
        }
      } else {
        fill(255);
      }
      rect(
        labelWidth + step * cellWidth,
        track * cellHeight,
        cellWidth,
        cellHeight
      );

      //Images in movement blocks
      if (drumNames[track] === "拍手 - CLAP" && cells[track][step]) {
        image(
          clap,
          labelWidth + step * cellWidth,
          track * cellHeight,
          cellWidth,
          cellHeight
        );
        if (step === currentStep) {
          image(
            clap,
            windowWidth - 520,
            windowHeight / 2,
            cellWidth,
            cellHeight
          );
          image(
            clap,
            windowWidth - 170,
            windowHeight / 2,
            cellWidth,
            cellHeight
          );
        }
      }

      if (drumNames[track] === "微蹲 - SQUAT" && cells[track][step]) {
        image(
          squat,
          labelWidth + step * cellWidth,
          track * cellHeight,
          cellWidth,
          cellHeight
        );
        if (step === currentStep) {
          image(
            squat,
            windowWidth - 520,
            (windowHeight * 1.8) / 3,
            cellWidth,
            cellHeight
          );
          image(
            squat,
            windowWidth - 170,
            (windowHeight * 1.8) / 3,
            cellWidth,
            cellHeight
          );
        }
      }

      if (drumNames[track] === "踢腿 - KICK" && cells[track][step]) {
        image(
          kick,
          labelWidth + step * cellWidth,
          track * cellHeight,
          cellWidth,
          cellHeight
        );
        if (step === currentStep) {
          image(
            kick,
            windowWidth - 520,
            (windowHeight * 1.8) / 3,
            cellWidth,
            cellHeight
          );
          image(
            kick,
            windowWidth - 170,
            (windowHeight * 1.8) / 3,
            cellWidth,
            cellHeight
          );
        }
      }

      if (drumNames[track] === "跺脚 - STAMP" && cells[track][step]) {
        image(
          stamp,
          labelWidth + step * cellWidth,
          track * cellHeight,
          cellWidth,
          cellHeight
        );
        if (step === currentStep) {
          image(
            stamp,
            windowWidth - 520,
            (windowHeight * 3) / 4,
            cellWidth,
            cellHeight
          );
          image(
            stamp,
            windowWidth - 170,
            (windowHeight * 3) / 4,
            cellWidth,
            cellHeight
          );
        }
      }

      //Text & Image in breath blocks
      fill(0);

      if (drumNames[track] === "嘘 - XU" && cells[track][step]) {
        text(
          "XU",
          labelWidth + (step + 0.5) * cellWidth,
          (track + 0.5) * cellHeight
        );
        if (step === currentStep) {
          push();
          fill(255, 0, 0, 60);
          ellipse(windowWidth - 320, windowHeight / 2.7, 30, 30);
          textSize(150);
          text("嘘", windowWidth - 470, 150);
          pop();
        }
      }

      if (drumNames[track] === "呵 - HE" && cells[track][step]) {
        text(
          "HE",
          labelWidth + (step + 0.5) * cellWidth,
          (track + 0.5) * cellHeight
        );
        if (step === currentStep) {
          push();
          fill(255, 0, 0, 60);
          ellipse(windowWidth - 270, windowHeight / 2.7, 30, 30);
          textSize(150);
          text("呵", windowWidth - 470, 150);
          pop();
        }
      }

      if (drumNames[track] === "呼 - HU" && cells[track][step]) {
        text(
          "HU",
          labelWidth + (step + 0.5) * cellWidth,
          (track + 0.5) * cellHeight
        );

        if (step === currentStep) {
          push();
          fill(255, 0, 0, 60);
          ellipse(windowWidth - 330, windowHeight / 2.1, 30, 30);
          textSize(150);
          text("呼", windowWidth - 470, 150);
          pop();
        }
      }

      if (drumNames[track] === "嘶 - SI" && cells[track][step]) {
        text(
          "SI",
          labelWidth + (step + 0.5) * cellWidth,
          (track + 0.5) * cellHeight
        );

        if (step === currentStep) {
          push();
          fill(255, 0, 0, 60);
          ellipse(windowWidth - 320, windowHeight / 2.5, 60, 80);
          ellipse(windowWidth - 260, windowHeight / 2.5, 60, 80);

          textSize(150);
          text("嘶", windowWidth - 470, 150);
          pop();
        }
      }

      if (drumNames[track] === "吹 - CHUI" && cells[track][step]) {
        text(
          "CHUI",
          labelWidth + (step + 0.5) * cellWidth,
          (track + 0.5) * cellHeight
        );
        if (step === currentStep) {
          push();
          fill(255, 0, 0, 60);
          ellipse(windowWidth - 250, windowHeight / 2.25, 30, 30);
          textSize(150);
          text("吹", windowWidth - 470, 150);
          pop();
        }
      }

      if (drumNames[track] === "嘻 - XI" && cells[track][step]) {
        text(
          "XI",
          labelWidth + (step + 0.5) * cellWidth,
          (track + 0.5) * cellHeight
        );
        if (step === currentStep) {
          push();
          fill(255, 0, 0, 60);
          ellipse(windowWidth - 295, windowHeight / 2.2, 120, 230);
          textSize(150);
          text("嘻", windowWidth - 470, 150);
          pop();
        }
      }
    }
  }

  //Highlight beat
  fill(234, 30, 83, 60);
  rect(labelWidth + currentStep * cellWidth, 0, cellWidth, windowHeight);

  push();
  strokeWeight(1);
  textAlign(RIGHT, CENTER);
  textSize(height / 45);
  fill(100, 0, 0);
  textFont("Doto");
  text("Gate", width - 10, height - 120);
  text("Observation Deck", width - 10, height - 75);
  text("DJ Mixer", width - 10, height - 30);
  pop();
}

function mousePressed() {
  let i = floor((mouseX - labelWidth) / cellWidth);
  let j = floor(mouseY / cellHeight);
  if (i >= 0 && i < nSteps() && j >= 0 && j < nTracks) {
    if (breathTracks.includes(drumNames[j])) {
      if (cells[j][i]) {
        cells[j][i] = 0;
      } else {
        for (let track = 0; track < breathTracks.length; track++) {
          cells[track][i] = 0;
        }
        cells[j][i] = 1;
      }
    } else if (movementTracks.includes(drumNames[j])) {
      if (cells[j][i]) {
        cells[j][i] = 0;
      } else {
        for (let track = 0; track < movementTracks.length; track++) {
          cells[track + breathTracks.length][i] = 0;
        }
        cells[j][i] = 1;
      }
    } else {
      cells[j][i] = !cells[j][i];
    }
  }
  //togate
  if (
    mouseX > width * 0.95 &&
    mouseX < width &&
    mouseY > height - 130 &&
    mouseY < height - 110
  ) {
    let newWindow = window.open(
      "http://lunafeng922.github.io/com-2025-luna/main/index.html"
    );
    window.close();
  }

  //toeyes
  if (
    mouseX > width * 0.85 &&
    mouseX < width &&
    mouseY > height - 85 &&
    mouseY < height - 65
  ) {
    let newWindow = window.open(
      "http://lunafeng922.github.io/com-2025-luna/nosetoeyes/index.html"
    );
    window.close();
  }
  //tomouth
  if (
    mouseX > width * 0.9 &&
    mouseX < width &&
    mouseY > height - 40 &&
    mouseY < height - 20
  ) {
    let newWindow = window.open(
      "http://lunafeng922.github.io/com-2025-luna/nosetomouth/index.html"
    );
    window.close();
  }
}

function togglePlay() {
  if (Tone.Transport.state === "started") {
    lastPosition = Tone.Transport.position;
    Tone.Transport.stop();
    playButton.html("开始 - PLAY");
  } else {
    // 确保在用户交互后才启动音频
    Tone.start()
      .then(() => {
        Tone.Transport.position = lastPosition;
        Tone.Transport.start();
        playButton.html("停止 - STOP");
      })
      .catch((e) => console.error(e));
  }
}

function setTempo(bpm) {
  Tone.Transport.bpm.rampTo(bpm);
}

function randomPattern() {
  for (let step = 0; step < nSteps(); step++) {
    let randomBreathTrack = random(breathTracks);
    let randomMovementTrack = random(movementTracks);
    for (let track = 0; track < nTracks; track++) {
      if (breathTracks.includes(drumNames[track])) {
        cells[track][step] =
          drumNames[track] === randomBreathTrack ? int(random(2)) : 0;
      }
      if (movementTracks.includes(drumNames[track])) {
        cells[track][step] =
          drumNames[track] === randomMovementTrack ? int(random(2)) : 0;
      }
    }
  }
}

function clearPattern() {
  for (let track = 0; track < nTracks; track++) {
    for (let step = 0; step < nSteps(); step++) {
      cells[track][step] = 0;
    }
  }
}

// Fullscreen functions
function toggleFullscreen() {
  let fs = fullscreen();
  fullscreen(!fs);
  setTimeout(() => {
    updateCanvasSize();
    resizeCanvas(windowWidth, windowHeight);
    repositionButtons();
  }, 100);
}

function updateCanvasSize() {
  cellWidth = (windowWidth - 600 - labelWidth) / nSteps();
  cellHeight = windowHeight / nTracks;
}

function repositionButtons() {
  let buttonY = 20;
  playButton.position(windowWidth - 150, buttonY);
  buttonY += 40;
  // Reposition all tempo buttons
  tempoButtons.forEach((button, index) => {
    button.position(windowWidth - 150, buttonY);
    buttonY += 40;
  });
  randomPatternButton.position(windowWidth - 150, buttonY);
  buttonY += 40;
  clearButton.position(windowWidth - 150, buttonY);
}

function windowResized() {
  if (fullscreen()) {
    updateCanvasSize();
    resizeCanvas(windowWidth, windowHeight);
    repositionButtons();
  }
}

function keyPressed() {
  if (key === " ") {
    let fs = fullscreen();
    fullscreen(!fs);
    setTimeout(() => {
      updateCanvasSize();
      resizeCanvas(windowWidth, windowHeight);
      repositionButtons();
    }, 100);
  }
}
