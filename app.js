"use strict";
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let canvasW = canvas.width;
let canvasH = canvas.height;
let player;
let mouse;

class Vector {
  constructor(x, y) {
    this.x = x || 0;
    this.y = y || 0;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  addVector(v) {
    this.x += v.x * 0.0005;
    this.y += v.y * 0.0005;
    return this;
  }

  subtract(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  divide(scalar) {
    if (scalar !== 0) {
      this.x /= scalar;
      this.y /= scalar;
    }
    return this;
  }

  normalize() {
    const length = this.length();
    if (length !== 0) {
      this.divide(length);
    }
    return this;
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
}

class Player {
  constructor(x, y) {
    this.position = new Vector(x, y);
    this.rotationAngle = 0;
  }
  
  playerUpdate() {
    this.rotationAngle = getAngle(mouse, this.position);
    // this.position.addVector(mouse.subtract(this.position))
    console.log(mouse.x, mouse.y);
    // if(mouse.x >= 0 && mouse.y >= 0) {
    //   this.position.addVector(mouse.subtract(this.position))
    // }
  // player.updatePosition(mouse.x - player.position.posX, mouse.y - player.position.posY);
  }

  display() {
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotationAngle);
    ctx.rect(40 / -2, 40 / -2, 40, 40);
    ctx.fillStyle = "blue";
    ctx.fill();
  }
}

window.onload = init;

function init() {
  player = new Player(canvasW / 2, canvasH / 2);
  mouse = new Vector();
  getMousePosition();
  window.requestAnimationFrame(gameLoop);
}

function gameLoop() {
  update();
  draw();
  window.requestAnimationFrame(gameLoop);
}

//maybe only compute if the mousemove is on the canvas if possible
function getMousePosition() {
  canvas.addEventListener("mousemove", function(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.set(event.clientX - rect.left, event.clientY - rect.top);
    console.log(mouse.x, mouse.y);
  });
}

function update() {
  player.playerUpdate();
  
}

function getAngle(cursorPos, playerPos) {
  return Math.atan2((cursorPos.y) - playerPos.y, (cursorPos.x) - playerPos.x);
}

function draw() {
  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.save();
  ctx.beginPath();
  player.display();
  // ctx.closePath();
  ctx.restore();
}
