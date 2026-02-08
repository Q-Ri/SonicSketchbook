//Glitch uses ES Lint to show errors, this does not play nicely with external libraries like p5, the line below will turn off those errors:
/*eslint no-undef: 0*/ 

/*
This is a very simple multi-user painting app. If you wanted to expand this, it would be better to use an offscreen buffer:
https://p5js.org/reference/#/p5/createGraphics

That way you could create a drawing that the user can zoom in and out of rather than scaling the drawing to the user's screen.
*/

// Create connection to Node.JS Server
const socket = io();
let sizeSlider;
let bSize = 30;

let r = 255;
let g = 0;
let b = 0;

let canvas;
let gui; 
let drawIsOn = false;
let button;

//let brushColor;

let rSlider;
let gSlider;
let bSlider;

let synth;
let reverb;
let startAudio = false;

const min_midi = 24;
const max_midi = 108;

let audioStarted = false;

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("sketch-container"); 
  canvas.mousePressed(startDrawing);//we only want to start draw when clicking on canvas element
  
  //add our gui
  gui = select("#gui-container");
  gui.addClass("open");//forcing it open at the start, remove if you want it closed


  // before you add the size slider
  sizeSlider = createSlider(1,100, bSize);
  sizeSlider.parent(gui);
  sizeSlider.addClass("slider");

  //call the handleSliderInputChange callback function on change to slider value
  sizeSlider.input(handleSliderInputChange);
  
  

  //add our gui menu panel button
  button = createButton(">");
  button.addClass("button");

  //Add the button to the parent gui HTML element
  button.parent(gui);
  
  //Adding a mouse pressed event listener to the button 
  button.mousePressed(handleButtonPress); 
 
  //set styling for the sketch
  background(0);
  noStroke();
  
  //give a random color when you first load the sketch in the browser
  //brushColor = color(random(255),random(255),random(255));

  rSlider = createSlider(0, 255, r);
  rSlider.parent(gui);
  rSlider.addClass("slider");

  gSlider = createSlider(0, 255, g);
  gSlider.parent(gui);
  gSlider.addClass("slider");

  bSlider = createSlider(0, 255, b);
  bSlider.parent(gui);
  bSlider.addClass("slider");

  rSlider.input(handleSliderInputChange);
  gSlider.input(handleSliderInputChange);
  bSlider.input(handleSliderInputChange);

  //call this once at start so the color matches our mapping to slider width
  handleSliderInputChange();

  synth = new p5.MonoSynth();
  reverb = new p5.Reverb();
  reverb.process(synth, 3, 2);
  reverb.drywet(0);
}

function draw() {

  if(drawIsOn){
    fill(r,g,b);
    circle(mouseX,mouseY,bSize);
  }

}

//Make this work on both mobile touch devices and computers
//we only want to draw if the click is on the canvas not on our GUI
//touch and mouse start events will call this callback
function startDrawing(){
  userStartAudio();
  drawIsOn = true;
}

//for end of interaction and movement we want to capture event even if not on canvas
function mouseReleased(){
  drawIsOn = false;
}

function touchEnded(){
  drawIsOn = false;
}

function mouseDragged() {

  //don't emit if we aren't drawing on the canvas
  if(!drawIsOn){
    return;
  }

 emitData();
 soundPoint(mouseX, mouseY);


}

function touchMoved() {
  if(!drawIsOn){
    return;
  }
  
 emitData();
 soundPoint();
  
}

function emitData(){
   socket.emit("drawing", {
    xpos: mouseX / width,
    ypos: mouseY / height,
    userR: r, //get the color channels
    userG: g,
    userB: b,
    userS: bSize  // userS: bSize / width  //see what's it's like to scale to users window
  });
}


function onDrawingEvent(data){
  fill(data.userR,data.userG,data.userB);
  // circle(data.xpos * width,data.ypos * height,data.userS*width);//scale to users window
  circle(data.xpos * width,data.ypos * height,data.userS);
  soundPoint(data.xpos*width, data.ypos*height, 0.25);
}

function handleButtonPress()
{
    gui.toggleClass("open");//remove or add the open class to animate our gui in and out
}

function handleSliderInputChange(){
  bSize = sizeSlider.value();
  
  r = map(rSlider.value(),0,rSlider.width,0,255);
  g = map(gSlider.value(),0,gSlider.width,0,255);
  b = map(bSlider.value(),0,bSlider.width,0,255);

}

function touchStarted() {
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }
  startDrawing();
}

function goStartAudio(){
  if(!startAudio){
    userStartAudio();
    startAudio = true;
  }
}

function midiY(y){
  return map(constrain(y, 0, height), height, 0, min_midi, max_midi);
}

function toneX(x){
  return map(constrain(x, 0, width), 0, width, 0.05, 0.9);
}

function soundPoint(x, y, ampOverride){
  const midi = midiY(y);
  const freq = midiToFreq(midi);

  // Brush size -> amplification (0..1)
  const ampFromBrush = map(constrain(bSize, 1, 100), 1, 100, 0.05, 1.0);
  const amp = (typeof ampOverride === "number") ? ampOverride : ampFromBrush;

  // Keep your original "tone" mapping from Y (but treat it as brightness of the hit)
  // We'll fold it into amp a bit so higher Y still feels stronger like before.
  const tone = toneX(x);
  const finalAmp = constrain(amp * tone, 0.02, 1.0);

  // Timbre from colour:
  // - more blue => more reverb
  // - more red => sharper wave
  // - green dominant => default (triangle-ish is fine too)
  const blueWet = map(constrain(b, 0, 255), 0, 255, 0.0, 0.7);
  reverb.drywet(blueWet);

  // choose oscillator type based on dominant channel
  if (r >= g && r >= b) {
    // red = sharper
    synth.oscillator.setType("triangle"); // try "sawtooth" if you want harsher
  } else if (b >= r && b >= g) {
    // blue = smoother/mysterious
    synth.oscillator.setType("sine");
  } else {
    // green (or mixed) = keep it simple
    synth.oscillator.setType("triangle");
  }

  synth.play(freq, finalAmp, 0, 0.1);
}

//Events we are listening for
// Connect to Node.JS Server
socket.on("connect", () => {
  console.log(socket.id);
});

// Callback function on the event we disconnect
socket.on("disconnect", () => {
  console.log(socket.id);
});

// Callback function to recieve message from Node.JS
socket.on("drawing", (data) => {
  console.log(data);

  onDrawingEvent(data);

});

function windowResized() {

  //wipes out the history of drawing if resized, potential fix, draw to offscreen buffer
  //https://p5js.org/reference/#/p5/createGraphics
 // resizeCanvas(windowWidth, windowHeight);

}
