"use strict";
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
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

class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  static subVector(v1, v2) {
    return new Vector(v1.x - v2.x, v1.y - v2.y);
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  subtract(v) {
    this.x -= v.x;
    this.y -= v.y;
  }

  multiply(scalar) {
    this.x *= scalar;
    this.y *= scalar;
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
    // console.log(`player position: ${this.position.x} ${this.position.y}`);
    // console.log(`mouse coordinates: ${mouse.x} ${mouse.y}`);
    // console.dir(`mouse vector position after vector subtract ${mouse.subtract(this.position).x} ${mouse.subtract(this.position).y}`);
    // console.log(`mouse regular substraction: ${mouse.x - this.position.x} ${mouse.y - this.position.y}`);
    // this.position.add({x: mouse.x - this.position.x, y: mouse.y - this.position.y});
    let dir = Vector.subVector(mouse, this.position).normalize();
    dir.multiply(1);
    this.position.add(dir);

  }

  display() {
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotationAngle);
    ctx.rect(40 / -2, 40 / -2, 40, 40);
    ctx.fillStyle = "blue";
    ctx.fill();
  }
}

//maybe only compute if the mousemove is on the canvas if possible
function getMousePosition() {
  canvas.addEventListener("mousemove", function(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.set(event.clientX - rect.left, event.clientY - rect.top);
  });
}

function getAngle(cursorPos, playerPos) {
  return Math.atan2((cursorPos.y) - playerPos.y, (cursorPos.x) - playerPos.x);
}


