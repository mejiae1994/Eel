"use strict";
import {Vector} from "./utils.js";
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const xSpan = document.getElementById("x");
const ySpan = document.getElementById("y");
let canvasW = canvas.width;
let canvasH = canvas.height;
let player;
let mouse;

window.onload = init;

function init() {
  player = new Player(canvasW / 2, canvasH / 2);
  mouse = new Vector(0,0);
  getMousePosition();
  window.requestAnimationFrame(gameLoop);
}

function gameLoop() {
  update();
  draw();
  window.requestAnimationFrame(gameLoop);
}

function update() {
  player.playerUpdate();
}

function draw() {
  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.save();
  ctx.beginPath();
  player.display();
  ctx.closePath();
  ctx.restore();
}

//maybe only compute if the mousemove is on the canvas if possible
function getMousePosition() {
  canvas.addEventListener("mousemove", function(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.set(event.clientX - rect.left, event.clientY - rect.top);
  });
}

class Player {
  constructor(x, y) {
    this.position = new Vector(x, y);
    this.rotationAngle = 0;
  }
  
  playerUpdate() {
    xSpan.innerText = `X: ${Math.round(this.position.x)}`
    ySpan.innerText = `Y: ${Math.round(this.position.y)}`

    this.rotationAngle = Vector.getAngle(mouse, this.position);
    let directionV = Vector.subVector(mouse, this.position).normalize();
    directionV.multiply(1);
    this.position.add(directionV);

  }

  display() {
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotationAngle);
    ctx.rect(40 / -2, 40 / -2, 40, 40);
    ctx.fillStyle = "blue";
    ctx.fill();
  }
}




