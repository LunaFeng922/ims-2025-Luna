//Orginal code from Professor Carrie Wang:https://editor.p5js.org/re7l/sketches/e-LPIpri2V

//Bit similar to one of my other code:https://editor.p5js.org/Zichen_Feng/sketches/NYC7H3R9j

//Demo for changing url:http://lunafeng922.github.io/ims-2025-Luna/ims-W3-luna/index.html?bgColor=255, 255, 100, 50&leftColor=80, 255, 100, 50&rightColor=255, 0, 100, 50&scale=1&city=London

//Things I add: distance between fingers - volume; ypos of circles - pitch;xpos of circles - panning; scales choice - 1-7; circles&bg -color choice; octave shift - according to temperature

let temperature = 0;
let weather = "";
let json;
let city = "New York";

let handPose;
let video;

let leftX = 0,
  leftY = 0,
  rightX = 0,
  rightY = 0;
let leftD = 0,
  rightD = 0;

let leftOsc, rightOsc;

let fullscreenButton;

let videoW, videoH, videoX, videoY;

let pentatonic = [];
let scaleIndex = 1;
let scaleNames = {
  1: "Major",
  2: "Minor",
  3: "Blues",
  4: "Egypt",
  5: "Hirajoshi",
  6: "Yo",
  7: "Balinese",
};

const scalePresets = {
  1: [0, 2, 4, 7, 9], // Major
  2: [0, 3, 5, 7, 10], // Minor
  3: [0, 3, 5, 6, 7, 10], // Blues
  4: [0, 2, 5, 7, 10], // Egypt
  5: [0, 2, 3, 7, 8], // Hirajoshi
  6: [0, 2, 5, 7, 9], // Yo
  7: [0, 1, 3, 7, 8], // Balinese
};

let leftColor = [80, 255, 100, 50];
let rightColor = [255, 0, 100, 50];

let bgColor = [255, 5];

let handDetectedLeft = false;
let handDetectedRight = false;

function preload() {
  handPose = ml5.handPose();
  let urlParams = get_url_params();
  // url - circle colors
  if (urlParams.leftColor) {
    leftColor = urlParams.leftColor.split(",").map(Number);
  }
  if (urlParams.rightColor) {
    rightColor = urlParams.rightColor.split(",").map(Number);
  }

  // url - bg
  if (urlParams.bgColor) {
    bgColor = urlParams.bgColor.split(",").map(Number);
  }

  // url - pentatonic choice
  if (urlParams.scale && scalePresets[urlParams.scale]) {
    scaleIndex = urlParams.scale;
  }

  let rootNote = 220;

  if (urlParams.city) {
    city = urlParams.city;
  }

  let url =
    "https://api.openweathermap.org/data/2.5/weather?q=" +
    city +
    "&units=metric&APPID=e812164ca05ed9e0344b89ebe273c141";

  loadJSON(
    url,
    (response) => {
      json = response;

      if (json && json.main && json.main.temp) {
        temperature = json.main.temp;
        weather = json.weather[0].description;

        let octaveShift = 0;
        if (temperature <= 10) {
          octaveShift = -1;
        } else if (temperature > 10 && temperature <= 20) {
          octaveShift = 0;
        } else if (temperature > 20 && temperature <= 30) {
          octaveShift = 1;
        } else {
          octaveShift = 2;
        }

        //console.log("Temperature:", temperature, "Octave Shift:", octaveShift);

        // apply octave shift multiplier
        let shiftMultiplier = Math.pow(2, octaveShift);

        pentatonic = getPentatonicFromRoot(
          rootNote,
          scalePresets[scaleIndex]
        ).map((freq) => freq * shiftMultiplier);

        //console.log("Scale:", scaleIndex, pentatonic);
      } else {
        //console.error("Can't access effective temperature");
        temperature = "N/A";
        weather = "Unknown";
      }
    },
    (error) => {
      //console.error("API Access Error:", error);
      temperature = "N/A";
      weather = "Unknown";
    }
  );

  // URL - octave shift (if unapplicable)
  let octaveShift = 0;
  if (urlParams.octaveShift) {
    octaveShift = parseInt(urlParams.octaveShift);
    if (isNaN(octaveShift)) octaveShift = 0;
  }

  // apply octave shift multiplier
  let shiftMultiplier = Math.pow(2, octaveShift);

  pentatonic = getPentatonicFromRoot(rootNote, scalePresets[scaleIndex]).map(
    (freq) => freq * shiftMultiplier
  );

  //console.log("Scale:", scaleIndex, pentatonic);
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  handPose.detectStart(video, gotHands);
  userStartAudio();

  leftOsc = new p5.Oscillator("triangle");
  rightOsc = new p5.Oscillator("square");
  leftOsc.start();
  rightOsc.start();
  leftOsc.amp(0);
  rightOsc.amp(0);

  fullscreenButton = createButton("Fullscreen");
  fullscreenButton.mousePressed(toggleFullscreen);
  positionUI();
  updateVideoDisplay();

  temperature = json.main.temp;
  weather = json.weather[0].description;
}

function draw() {
  background(...bgColor);

  updateVideoDisplay();

  noStroke();

  if (handDetectedLeft && leftD > 0) {
    fill(...leftColor);
    circle(leftX, leftY, leftD);
  }

  if (handDetectedRight && rightD > 0) {
    fill(...rightColor);
    circle(rightX, rightY, rightD);
  }

  if (!handDetectedLeft) leftOsc.amp(0, 0.1);
  if (!handDetectedRight) rightOsc.amp(0, 0.1);

  // Current Scale name and instruction text
  push();
  fill(0);
  textSize(24);
  textAlign(LEFT, TOP);
  textFont("Doto");
  text("Scale:" + scaleNames[scaleIndex], 20, 20);
  text("City: " + city, 20, 50);
  text("Current temperature: " + temperature, 20, 80);
  text("Forecast: " + weather, 20, 110);
  text(
    "*** Pinch your thumbs and index fingers together to draw and compose ***",
    20,
    height - 70
  );
  pop();
}

function gotHands(results) {
  handDetectedLeft = false;
  handDetectedRight = false;

  let vw = video.width;
  let vh = video.height;

  //***seems that you still need to include thisline for the sketch to go through all the hands
  results.forEach((hand) => {
    handDetection(hand, vw, vh);
  });
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
    let volume = map(distBetween, 20, 200, 0, 0.5);
    volume = constrain(volume, 0, 0.5);

    let noteIndexY = Math.floor(map(centerY, height, 0, 0, pentatonic.length));
    noteIndexY = constrain(noteIndexY, 0, pentatonic.length - 1);

    let panXR = map(centerX, 0, width / 2, -1, 1);
    panXR = constrain(panXR, -1, 1);
    let panXL = map(centerX, width / 2, width, -1, 1);
    panXL = constrain(panXL, -1, 1);

    if (landmarks.handedness === "Left") {
      leftX = centerX;
      leftY = centerY;
      leftD = distBetween;

      leftOsc.freq(pentatonic[noteIndexY]);
      leftOsc.amp(volume, 0.05);
      leftOsc.pan(panXL);
      handDetectedLeft = true;
    }

    if (landmarks.handedness === "Right") {
      rightX = centerX;
      rightY = centerY;
      rightD = distBetween;

      rightOsc.freq(pentatonic[noteIndexY]);
      rightOsc.amp(volume * 0.5, 0.05);
      rightOsc.pan(panXR);
      handDetectedRight = true;
    }
  }
}

function toggleFullscreen() {
  let fs = fullscreen();
  fullscreen(!fs);
  setTimeout(() => {
    resizeCanvas(windowWidth, windowHeight);
    updateVideoDisplay();
    positionUI();
  }, 100);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateVideoDisplay();
  positionUI();
}

function positionUI() {
  fullscreenButton.position(20, height - 30);
}

function updateVideoDisplay() {
  let aspect = 4 / 3;
  if (windowWidth / windowHeight > aspect) {
    videoH = windowHeight;
    videoW = videoH * aspect;
  } else {
    videoW = windowWidth;
    videoH = videoW / aspect;
  }
  videoX = (width - videoW) / 2;
  videoY = (height - videoH) / 2;
}

function getPentatonicFromRoot(rootFreq, semitoneOffsets) {
  return semitoneOffsets.map((offset) => rootFreq * Math.pow(2, offset / 12));
}

// url parameters
function get_url_params() {
  let query = window.location.search;
  if (query.length < 1) return {};
  return Object.fromEntries(new URLSearchParams(query));
}

