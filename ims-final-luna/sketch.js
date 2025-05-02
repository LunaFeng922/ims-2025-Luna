//city - different pentatonic & img
//temp of city - pitch
//weather of city - soundwave form - circle shape
//day/night/rain - bgcolor

//interaction: hands: Distance - volume; Pos of y - Which note to trigger in pentatonic; pos of x - left & right panning;

//References:

//Orginal code from Professor Carrie Wang:https://editor.p5js.org/re7l/sketches/e-LPIpri2V

//Bit similar to one of my other code:https://editor.p5js.org/Zichen_Feng/sketches/NYC7H3R9j

//Original API code: https://editor.p5js.org/Zichen_Feng/sketches/6O3iqfNRN

// 16 nyu sites
const cities = [
  "Abu Dhabi",
  "Accra",
  "Berlin",
  "Buenos Aires",
  "Florence",
  "London",
  "Los Angeles",
  "Madrid",
  "New York",
  "Paris",
  "Prague",
  "Shanghai",
  "Sydney",
  "Tel Aviv",
  "Tulsa",
  "Washington DC",
];

let img, maskGraphics;
let handimg, handnmg;
let temperature = 0,
  weather = "",
  json;
let city = cities[0],
  isDay = true;
let handPose,
  hands = [],
  video;
let leftX = 0,
  leftY = 0,
  rightX = 0,
  rightY = 0;
let leftD = 0,
  rightD = 0;
let leftOsc, rightOsc;
let videoW, videoH, videoX, videoY;
let canvasW, canvasH;
let pentatonic = [];
let bgColor = [0];
let handDetectedLeft = false,
  handDetectedRight = false;
let currentCityIndex = 0;
let cityCycleInterval;

// pentatonic scales
const cityScalePresets = {
  "Abu Dhabi": [0, 1, 5, 7, 8],
  Accra: [0, 3, 5, 8, 10],
  Berlin: [0, 2, 3, 6, 9],
  "Buenos Aires": [0, 1, 4, 6, 7],
  Florence: [0, 2, 4, 7, 9],
  London: [0, 3, 5, 6, 9],
  "Los Angeles": [0, 2, 5, 7, 9],
  Madrid: [0, 2, 3, 7, 10],
  "New York": [0, 3, 5, 6, 7],
  Paris: [0, 2, 4, 6, 9],
  Prague: [0, 2, 3, 5, 7],
  Shanghai: [0, 2, 5, 7, 9],
  Sydney: [0, 2, 5, 7, 10],
  "Tel Aviv": [0, 1, 4, 5, 8],
  Tulsa: [0, 3, 5, 7, 10],
  "Washington DC": [0, 2, 5, 6, 9],
};

function preload() {
  img = loadImage(city + ".jpg");
  handimg = loadImage("handins.png");
  handimg.resize(220, 130);
  handnmg = loadImage("handnis.png");
  handnmg.resize(220, 130);

  handPose = ml5.handPose();
  updateWeatherData();
  setInterval(updateWeatherData, 60000);
}

function createOscillator(type) {
  const osc = new Tone.Oscillator({
    frequency: 440,
    type: type,
    volume: -Infinity,
  }).start();

  const panner = new Tone.Panner(0).toDestination();
  const analyser = new Tone.Analyser("waveform", 1024);

  osc.chain(panner, analyser, Tone.Destination);

  return {
    osc: osc,
    panner: panner,
    analyser: analyser,
  };
}

function updateWeatherData() {
  let rootNote = 220;
  let url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&APPID=e812164ca05ed9e0344b89ebe273c141`;

  loadJSON(url, (response) => {
    json = response;
    if (json && json.main && json.main.temp) {
      img = loadImage(city + ".jpg", () => {});

      temperature = json.main.temp;
      weather = json.weather[0].description;
      isDay = json.dt >= json.sys.sunrise && json.dt < json.sys.sunset;

      let w = weather;
      let leftType, rightType;

      if (w.includes("clear")) {
        leftType = "triangle";
        rightType = "triangle";
      } else if (w.includes("cloud")) {
        leftType = "triangle";
        rightType = "sine";
      } else if (w.includes("rain") || w.includes("snow")) {
        leftType = "sine";
        rightType = "sine";
      } else if (w.includes("storm")) {
        leftType = "sawtooth";
        rightType = "square";
      } else {
        leftType = "sawtooth";
        rightType = "sawtooth";
      }

      if (leftOsc) leftOsc.osc.dispose();
      if (rightOsc) rightOsc.osc.dispose();

      leftOsc = createOscillator(leftType);
      rightOsc = createOscillator(rightType);

      if (isDay) {
        bgColor =
          w.includes("rain") || w.includes("snow")
            ? [200, 200, 255] // rain & day
            : [255, 250, 100]; // day without rain
      } else {
        bgColor = [10, 15, 30]; // night
      }

      // temp - octave
      let octaveShift;
      if (temperature <= 0) octaveShift = 2;
      else if (temperature <= 10) octaveShift = 0;
      else if (temperature <= 30) octaveShift = 1;
      else octaveShift = -1;

      let shiftMultiplier = Math.pow(2, octaveShift);
      let selectedScale = cityScalePresets[city] || cityScalePresets.Florence;
      pentatonic = getPentatonicFromRoot(rootNote, selectedScale).map(
        (f) => f * shiftMultiplier
      );
    }
  });
}

// function setup() {
//   updateCanvasSize();
//   createCanvas(canvasW, canvasH);
//   maskGraphics = createGraphics(canvasW, canvasH);
//   video = createCapture(VIDEO);
//   video.size(640, 480);
//   video.hide();
//   Tone.start();
//   handPose.detectStart(video, gotHands);
//   updateVideoDisplay();
//   cityCycleInterval = setInterval(cycleCity, 60000);
// }

function setup() {
  updateCanvasSize();
  createCanvas(canvasW, canvasH);
  maskGraphics = createGraphics(canvasW, canvasH);
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  updateVideoDisplay();

  cityCycleInterval = setInterval(cycleCity, 60000);

  // 不在这里调用 Tone.start() 或 detectStart
}

let started = false;
function mousePressed() {
  if (!started) {
    Tone.start().then(() => {
      console.log("Audio started");
      started = true;
      handPose.detectStart(video, gotHands);
    });
  }
}

function draw() {
  background(...bgColor);
  updateVideoDisplay();

  let bgImg = img.get();
  bgImg.resize(canvasW, canvasH);
  push();
  translate(canvasW, 0);
  scale(-1, 1);
  tint(0, 30);
  image(bgImg, 0, 0);
  noTint();
  pop();

  maskGraphics.clear();
  maskGraphics.stroke(255);
  maskGraphics.fill(255);

  if (handDetectedLeft && leftD > 0) {
    let leftWaveform = leftOsc.analyser.getValue();
    drawWaveCircle(maskGraphics, width - leftX, leftY, leftD, leftWaveform);
  }

  if (handDetectedRight && rightD > 0) {
    let rightWaveform = rightOsc.analyser.getValue();
    drawWaveCircle(maskGraphics, width - rightX, rightY, rightD, rightWaveform);
  }

  let tempImg = img.get();
  tempImg.resize(canvasW, canvasH);
  tempImg.mask(maskGraphics);
  push();
  translate(canvasW, 0);
  scale(-1, 1);
  image(tempImg, 0, 0);
  pop();

  if (!handDetectedLeft) leftOsc.osc.volume.rampTo(-Infinity, 0.1);
  if (!handDetectedRight) rightOsc.osc.volume.rampTo(-Infinity, 0.1);

  push();
  fill(isDay ? 0 : 255);
  noStroke();
  textSize(24);
  textAlign(LEFT, TOP);
  textFont("Doto");
  text(`City: ${city}`, 20, 20);
  text(`Temp: ${temperature}°C`, 20, 50);
  text(`Weather: ${weather}`, 20, 80);
  pop();

  push();
  for (let hand of hands) {
    if (hand.confidence > 0.1) {
      let isLeft = hand.handedness == "Left";
      let points = hand.keypoints.map((k) => ({
        x: map(k.x, 0, video.width, canvasW, 0),
        y: map(k.y, 0, video.height, 0, canvasH - videoY),
      }));

      fill(isLeft ? color(255, 0, 255) : color(255, 100, 0));
      noStroke();
      for (let pt of points) circle(pt.x, pt.y, 16);

      stroke(isLeft ? color(255, 0, 255, 150) : color(255, 100, 0, 150));
      strokeWeight(3);
      noFill();

      [
        [0, 1, 2, 3, 4],
        [0, 5, 6, 7, 8],
        [0, 9, 10, 11, 12],
        [0, 13, 14, 15, 16],
        [0, 17, 18, 19, 20],
      ].forEach((finger) => {
        beginShape();
        finger.forEach((idx) => vertex(points[idx].x, points[idx].y));
        endShape();
      });
    }
  }
  pop();

  push();
  image(isDay ? handnmg : handimg, canvasW - 220, 0, 220, 130);
  pop();
}

function drawWaveCircle(gfx, x, y, diameter, waveform) {
  let radius = diameter / 2;
  let detail = 200;
  gfx.beginShape();
  for (let i = 0; i <= detail; i++) {
    let angle = map(i, 0, detail, 0, TWO_PI);
    let index = floor(map(i, 0, detail, 0, waveform.length - 1));
    let waveOffset = map(waveform[index], -1, 1, -radius * 0.2, radius * 0.2);
    let px = x + (radius + waveOffset) * cos(angle);
    let py = y + (radius + waveOffset) * sin(angle);
    gfx.vertex(px, py);
  }
  gfx.endShape(CLOSE);
}

function gotHands(results) {
  handDetectedLeft = false;
  handDetectedRight = false;
  hands = results;
  results.forEach((hand) => handDetection(hand, video.width, video.height));
}

function handDetection(landmarks, vw, vh) {
  if (landmarks.thumb_tip && landmarks.index_finger_tip) {
    let x1 = map(landmarks.thumb_tip.x, 0, vw, videoX + videoW, videoX);
    let y1 = map(landmarks.thumb_tip.y, 0, vh, videoY, videoY + videoH);
    let x2 = map(landmarks.index_finger_tip.x, 0, vw, videoX + videoW, videoX);
    let y2 = map(landmarks.index_finger_tip.y, 0, vh, videoY, videoY + videoH);

    let centerX = (x1 + x2) / 2;
    let centerY = (y1 + y2) / 2;
    let distBetween = dist(x1, y1, x2, y2);
    let volume = constrain(map(distBetween, 20, 200, -40, 0), -40, 0);
    let noteIndex = constrain(
      floor(map(centerY, canvasH, 0, 0, pentatonic.length)),
      0,
      pentatonic.length - 1
    );
    let pan = constrain(map(centerX, 0, canvasW, -1, 1), -1, 1);

    if (landmarks.handedness === "Left") {
      leftX = centerX;
      leftY = centerY;
      leftD = distBetween;
      leftOsc.osc.frequency.value = pentatonic[noteIndex];
      leftOsc.osc.volume.rampTo(isDay ? volume - 10 : volume - 12, 0.05);
      leftOsc.panner.pan.value = pan;
      handDetectedLeft = true;
    } else if (landmarks.handedness === "Right") {
      rightX = centerX;
      rightY = centerY;
      rightD = distBetween;
      rightOsc.osc.frequency.value = pentatonic[noteIndex];
      rightOsc.osc.volume.rampTo(isDay ? volume - 10 : volume - 12, 0.05);
      rightOsc.panner.pan.value = pan;
      handDetectedRight = true;
    }
  }
}

function cycleCity() {
  currentCityIndex = (currentCityIndex + 1) % cities.length;
  city = cities[currentCityIndex];
  //console.log(`切换到城市: ${city}`);
  updateWeatherData();
}

function keyPressed() {
  if (key === "f" || key === "F") toggleFullscreen();
  if (keyCode === ESCAPE && fullscreen()) toggleFullscreen();
  if (key === "n" || key === "N") cycleCity(); // 手动切换城市
}

function toggleFullscreen() {
  let fs = fullscreen();
  fullscreen(!fs);
  setTimeout(() => {
    updateCanvasSize();
    resizeCanvas(canvasW, canvasH);
    updateVideoDisplay();
  }, 100);
}

function windowResized() {
  updateCanvasSize();
  resizeCanvas(canvasW, canvasH);
  maskGraphics = createGraphics(canvasW, canvasH);
  updateVideoDisplay();
}

function updateCanvasSize() {
  let winW = windowWidth * 0.8;
  let winH = windowHeight * 0.8;
  let targetAspect = 4 / 3;

  if (winW / winH > targetAspect) {
    canvasH = winH;
    canvasW = canvasH * targetAspect;
  } else {
    canvasW = winW;
    canvasH = canvasW / targetAspect;
  }
}

function updateVideoDisplay() {
  let aspect = 4 / 3;
  if (canvasW / canvasH > aspect) {
    videoH = canvasH;
    videoW = videoH * aspect;
  } else {
    videoW = canvasW;
    videoH = videoW / aspect;
  }
  videoX = (canvasW - videoW) / 2;
  videoY = (canvasH - videoH) / 2;
}

function getPentatonicFromRoot(rootFreq, semitoneOffsets) {
  return semitoneOffsets.map((offset) => rootFreq * Math.pow(2, offset / 12));
}

function remove() {
  clearInterval(cityCycleInterval);
  if (leftOsc) leftOsc.osc.dispose();
  if (rightOsc) rightOsc.osc.dispose();
}
