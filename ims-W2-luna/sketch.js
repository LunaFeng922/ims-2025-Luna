//It's adapted from my code of music timbre assignment.

//Welcome to Radio 92.2! You can choose to play on your own or invite a friend to wear the earphone & you be the DJ or vice versa!

//🚨🚨🚨PLZ PLZ PLZ remember to wear earphone to interact with it or the computer will crash down!!!

//🚨🚨Go to the sound setting in your computer - Set the sound input to your computer input & output to earphone output🤲 - double check before you play or you will be very confused.

//Things I played with here: 1️⃣ 4 sound effects remixing human-made sounds & oscillator sounds; 2️⃣ pitch slider control human-made sounds & oscillator sounds; 3️⃣ Speech recognition; 4️⃣ change soundwave forms of oscillator sounds; 5️⃣ Output sound-wave visualization; 6️⃣ key-triggered note visualization;

//human-made sounds
var mic;
var chorus, distortion, freeverb, phaser, pitchShift;
var recognizedText = "";
var language = "en-US";
var recognition;
var waveform;
var pitchSlider;
var currentEffect;
var currentFont;

//oscillator sounds
let oscillators = [];
let envelopes = [];
let phase = [];
let waveType = "sine";

// C Major Scale (C4, D4, E4, F4, G4, A4)
const frequencies = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0];
const keys = ["D", "F", "G", "H", "J", "K"];

let activeKeys = [false, false, false, false, false, false];

function preload() {
  mic = new Tone.UserMedia();
  mic
    .open()
    .then(() => {
      console.log("Microphone is open.");
      mic.volume.value = 10;
    })
    .catch((err) => {
      console.error("Error opening microphone: ", err);
    });

  // Sound Effects
  chorus = new Tone.Chorus(4, 2.5, 0.5);
  distortion = new Tone.Distortion(1);
  freeverb = new Tone.Freeverb();
  freeverb.dampening.value = 1000;
  phaser = new Tone.Phaser({
    frequency: 15,
    octaves: 5,
    baseFrequency: 1000,
  });

  // PitchShift
  pitchShift = new Tone.PitchShift(0);
  pitchShift.toMaster();

  // current sound effect
  currentEffect = chorus;
  mic.connect(currentEffect);
  currentEffect.connect(pitchShift);

  //current font
  currentFont = "DM Serif Text";

  //waveform
  waveform = new Tone.Waveform(512);
  pitchShift.connect(waveform);

  //speech detection
  speechRecognition();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textSize(32);
  fill(255);
  textAlign(CENTER, CENTER);

  fullscreenButton = createButton("Fullscreen");
  fullscreenButton.mousePressed(toggleFullscreen);

  chorusButton = createButton("Chorus");
  chorusButton.mousePressed(() => enableEffect(chorus, "DM Serif Text"));

  distortionButton = createButton("Distortion");
  distortionButton.mousePressed(() =>
    enableEffect(distortion, "Rubik Doodle Triangles")
  );

  freeverbButton = createButton("Freeverb");
  freeverbButton.mousePressed(() => enableEffect(freeverb, "Glass Antiqua"));

  phaserButton = createButton("Phaser");
  phaserButton.mousePressed(() => enableEffect(phaser, "Doto"));

  waveButton = createButton("Switch Waveform");
  waveButton.mousePressed(switchWaveform);

  pitchSlider = createSlider(-12, 12, 0, 0.1);
  pitchSlider.style("transform", "rotate(-90deg)");
  pitchSlider.style("width", "200px");

  windowResized();

  for (let i = 0; i < 6; i++) {
    let env = new Tone.AmplitudeEnvelope({
      attack: 0.1 + i * 0.05,
      decay: 0.4 - i * 0.05,
      sustain: 0.8,
      release: 0.5 + i * 0.1,
    });

    let osc = new Tone.Oscillator({
      frequency: frequencies[i],
      type: waveType,
    });

    osc.connect(env);
    env.connect(currentEffect);
    currentEffect.connect(pitchShift);
    pitchShift.toMaster();
    osc.start();
    osc.volume.value = -6;
    envelopes.push(env);
    oscillators.push(osc);
  }
}

function draw() {
  background(0);

  let pitchValue = pitchSlider.value();
  pitchShift.pitch = pitchValue;

  let stretch = map(pitchValue, -12, 12, 2, 0.5);

  fill(255);
  textFont(currentFont);

  push();
  textSize(64);
  textAlign(CENTER, CENTER);
  scale(stretch, 1.4 / stretch);
  text(
    recognizedText,
    width / 2 / stretch - 10,
    ((height / 1.4) * stretch) / 2
  );
  pop();

  textSize(20);
  push();
  textAlign(RIGHT, CENTER);
  text("Pitch: " + pitchShift.pitch.toFixed(1), width - 20, 250);
  text("Press D, F, G, H, J, K to play notes", width - 20, height - 60);
  text("Current Waveform: " + waveType, width - 20, height - 20);
  pop();

  drawWaveform(100, height / 2, width - 200, 200);

  drawKeyCircles();
}

//Sound Effect & Font shift
function enableEffect(effect, fontName) {
  mic.disconnect();
  currentEffect.disconnect();
  currentEffect = effect;
  mic.connect(currentEffect);
  currentEffect.connect(pitchShift);

  for (let i = 0; i < oscillators.length; i++) {
    envelopes[i].disconnect();
    envelopes[i].connect(currentEffect);
  }
  console.log(fontName + " effect enabled");

  currentFont = fontName;
}

//showcasing waveforms of the sounds from computer
function drawWaveform(x, y, w, h) {
  push();
  translate(x, y);
  let wave = waveform.getValue();
  noFill();
  stroke(255);
  strokeWeight(2);
  beginShape();
  for (let i = 0; i < wave.length; i++) {
    let xPos = map(i, 0, wave.length, 0, w);
    let yPos = map(wave[i], -1, 1, h, 0);
    vertex(xPos, yPos);
  }
  endShape();
  pop();
}

//mic speech recognition - not very accurate tho
function speechRecognition() {
  if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = function (event) {
      var currentTranscript = "";
      for (var i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      recognizedText = currentTranscript;
    };

    recognition.onerror = function (event) {
      console.error("Speech Recognition Error: ", event.error);
    };

    recognition.onend = function () {
      console.log("Speech Recognition ended.");
      recognition.start();
    };

    recognition.start();
    console.log("Speech Recognition Started.");
  } else {
    console.error("Speech Recognition Failed.");
  }
}

//Circles representing notes
function drawKeyCircles() {
  let x = width / 2 - 150;
  let y = height - 150;
  let spacing = 60;
  for (let i = 0; i < keys.length; i++) {
    if (activeKeys[i]) {
      fill(255);
    } else {
      noFill();
    }
    push();
    stroke(255);
    strokeWeight(2);
    ellipse(x + i * spacing, y, 30, 30);
    pop();
  }
}

//Trigger Oscillator
function keyPressed() {
  let index = keys.indexOf(key.toUpperCase());
  if (index !== -1) {
    activeKeys[index] = true;
    let pitchValue = pitchSlider.value();
    let pitchFactor = Math.pow(2, pitchValue / 12);
    oscillators[index].frequency.value = frequencies[index] * pitchFactor;
    envelopes[index].triggerAttack();
  }
}

function keyReleased() {
  let index = keys.indexOf(key.toUpperCase());
  if (index !== -1) {
    activeKeys[index] = false;
  }
  envelopes.forEach((env) => env.triggerRelease());
}

//Waveform for Oscillator
function switchWaveform() {
  let waveforms = ["sine", "square", "triangle", "sawtooth"];
  let index = waveforms.indexOf(waveType);
  waveType = waveforms[(index + 1) % waveforms.length];

  for (let i = 0; i < oscillators.length; i++) {
    oscillators[i].stop();
    oscillators[i].type = waveType;
    oscillators[i].start();
  }
}

// fullscreen
function toggleFullscreen() {
  let fs = fullscreen();
  fullscreen(!fs);
}

function resizeCanvasToWindow() {
  resizeCanvas(windowWidth, windowHeight);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  pitchSlider.position(width - 150, 100);

  let buttonX = 20;
  let spacing = 40;

  fullscreenButton.position(buttonX, height - 50);
  chorusButton.position(buttonX, 20);
  distortionButton.position(buttonX, 20 + spacing);
  freeverbButton.position(buttonX, 20 + spacing * 2);
  phaserButton.position(buttonX, 20 + spacing * 3);
  waveButton.position(buttonX, 20 + spacing * 4);
}
