/* eslint no-undef: 0 */

/*
Sonic Sketchbook

Kyuri Kim (Q-Ri)
(2026)
*/ 


const socket = io();

// Visual state
let canvas;
let gui;
let toggleButton;
let drawIsOn = false;

// Brush controls
let brushSize = 30;
let redValue = 255;
let greenValue = 0;
let blueValue = 0;

// Sliders
let sizeSlider;
let rSlider;
let gSlider;
let bSlider;

// Audio
let synth;
let reverb;
let audioStarted = false;

// MIDI mapping
const MIN_MIDI = 24;
const MAX_MIDI = 108;

// UI / control ranges
const MIN_BRUSH_SIZE = 1;
const MAX_BRUSH_SIZE = 100;
const MAX_COLOUR = 255;

function setup() {
  setupCanvas();
  setupGUI();
  setupAudio();

  background(0);
  noStroke();
  updateSliderValues();
}

function setupCanvas() {
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("sketch-container");
  canvas.mousePressed(startDrawing);
  canvas.touchStarted(startDrawing);
}

function setupGUI() {
  gui = select("#gui-container");
  gui.addClass("open");

  sizeSlider = createSlider(MIN_BRUSH_SIZE, MAX_BRUSH_SIZE, brushSize);
  sizeSlider.parent(gui);
  sizeSlider.addClass("slider");
  sizeSlider.input(updateSliderValues);

  rSlider = createSlider(0, MAX_COLOUR, redValue);
  rSlider.parent(gui);
  rSlider.addClass("slider");
  rSlider.input(updateSliderValues);

  gSlider = createSlider(0, MAX_COLOUR, greenValue);
  gSlider.parent(gui);
  gSlider.addClass("slider");
  gSlider.input(updateSliderValues);

  bSlider = createSlider(0, MAX_COLOUR, blueValue);
  bSlider.parent(gui);
  bSlider.addClass("slider");
  bSlider.input(updateSliderValues);

  toggleButton = createButton(">");
  toggleButton.addClass("button");
  toggleButton.parent(gui);
  toggleButton.mousePressed(toggleGUI);
}

function setupAudio() {
  synth = new p5.MonoSynth();

  reverb = new p5.Reverb();
  reverb.process(synth, 3, 2);
  reverb.drywet(0);
}

function draw() {
  if (drawIsOn) {
    fill(redValue, greenValue, blueValue);
    circle(mouseX, mouseY, brushSize);
  }
}

function startDrawing() {
  startAudio();
  drawIsOn = true;
}

function mouseReleased() {
  drawIsOn = false;
}

function touchEnded() {
  drawIsOn = false;
}

function mouseDragged() {
  if (!drawIsOn) return;

  emitDrawingData();
  soundPoint(mouseX, mouseY);
}

function touchMoved() {
  if (!drawIsOn) return;

  emitDrawingData();
  soundPoint(mouseX, mouseY);

  // Prevent page scrolling on mobile
  return false;
}

// Send normalised drawing data so other users can recreate the mark on their screen
function emitDrawingData() {
  socket.emit("drawing", {
    xpos: mouseX / width,
    ypos: mouseY / height,
    userR: redValue,
    userG: greenValue,
    userB: blueValue,
    userS: brushSize
  });
}

function onDrawingEvent(data) {
  fill(data.userR, data.userG, data.userB);
  circle(data.xpos * width, data.ypos * height, data.userS);

  // Remote sounds play more quietly than local gestures
  soundPoint(data.xpos * width, data.ypos * height, 0.25);
}

function toggleGUI() {
  gui.toggleClass("open");
}

function updateSliderValues() {
  brushSize = sizeSlider.value();

  redValue = rSlider.value();
  greenValue = gSlider.value();
  blueValue = bSlider.value();
}

function startAudio() {
  if (!audioStarted) {
    userStartAudio();
    audioStarted = true;
  }
}

function midiFromY(y) {
  return map(constrain(y, 0, height), height, 0, MIN_MIDI, MAX_MIDI);
}

function brightnessFromX(x) {
  return map(constrain(x, 0, width), 0, width, 0.05, 0.9);
}

// Convert drawing position, brush size, and colour into sound parameters
function soundPoint(x, y, ampOverride) {
  const midi = midiFromY(y);
  const freq = midiToFreq(midi);

  // Brush size controls loudness
  const ampFromBrush = map(
    constrain(brushSize, MIN_BRUSH_SIZE, MAX_BRUSH_SIZE),
    MIN_BRUSH_SIZE,
    MAX_BRUSH_SIZE,
    0.05,
    1.0
  );

  const amp = typeof ampOverride === "number" ? ampOverride : ampFromBrush;

  // X position affects brightness / intensity
  const brightness = brightnessFromX(x);
  const finalAmp = constrain(amp * brightness, 0.02, 1.0);

  applyColourTimbre();
  synth.play(freq, finalAmp, 0, 0.1);
}

function applyColourTimbre() {
  // Blue increases reverb
  const blueWet = map(constrain(blueValue, 0, 255), 0, 255, 0.0, 0.7);
  reverb.drywet(blueWet);

  // Dominant colour changes oscillator character
  if (redValue >= greenValue && redValue >= blueValue) {
    synth.oscillator.setType("triangle");
  } else if (blueValue >= redValue && blueValue >= greenValue) {
    synth.oscillator.setType("sine");
  } else {
    synth.oscillator.setType("triangle");
  }
}

// Socket events
socket.on("connect", () => {
  console.log("Connected:", socket.id);
});

socket.on("disconnect", () => {
  console.log("Disconnected:", socket.id);
});

socket.on("drawing", (data) => {
  console.log(data);
  onDrawingEvent(data);
});

function windowResized() {
  // Current version does not resize the canvas to avoid losing drawing history.
  // A future version could use createGraphics() as an offscreen buffer.
}
