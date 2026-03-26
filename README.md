# Sonic Sketchbook

Kyuri Kim (Q-Ri)
(2026)

## Description

Sonic Sketchbook is a multi-user collaborative drawing application that combines networked real-time drawing with sound interaction. Built using p5.js, socket.io, and p5.sound, the project allows users to paint on a shared canvas while generating sound in response to their gestures.

This project extends a web-socket-based multi-user drawing example using socket.io, further developing it into a sonic sketchbook system.

This project can also be seen on [Render] (https://render.com/): [https://sonic-sketchbook.onrender.com] (https://sonic-sketchbook.onrender.com)

The original example can be seen on [Render](https://render.com/): [https://remote-painter.onrender.com/](https://remote-painter.onrender.com/)


## Run Locally

Once you have downloaded or cloned the repo. In VS Code open the terminal, make sure you are in the root directory (you can run the command `pwd` to double check).

1. Run `npm install`

2. Run `node app.js` to start the server

3. You will then need to go to http://localhost:3000/ in your browser window(s) to test the multiplayer functionality locally on your machine. Optionally, specify a port by supplying the `port` variable in app.js. `process.env.PORT` variable will be used instead when available (e.g. on Render.com).

## Interaction
Click / touch to start drawing
Drag to draw on the canvas

## Controls
- X position → brightness / intensity
- Y position → pitch
- Brush size → amplitude (volume)
- Colour (RGB sliders) → timbre and reverb

- Multiple users can draw simultaneously on the same canvas
- Remote users’ sounds are played at lower amplitude

## Acknowledgements
- Remote Painter by Rebecca Aston  
- Socket.IO (real-time drawing data transmission)  
- p5.js and p5.sound (canvas drawing, oscillator, and sound mapping)  
- OpenAI (2026) ChatGPT (for debugging and development support)  
