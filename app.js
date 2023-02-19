"use strict";
import {Vector} from "./utils.js";
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const xSpan = document.getElementById("x");
const ySpan = document.getElementById("y");
const mouseX = document.getElementById("mouse-x");
const mouseY = document.getElementById("mouse-y");
const fpsSpan = document.getElementById("fps");
let canvasW = canvas.width;
let canvasH = canvas.height;
let player;
let mouse;
let enemy;
let lastTimestamp = 0;
let fps;

window.onload = init;

function init() {
  player = new Eel(canvasW / 2, canvasH / 2);
  mouse = new Vector(0,0);
  enemy = new Prey(500, 300);
  handleKeyInput();
  setMouseEvent();
  getMousePosition();
  window.requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
  const elapsed = timestamp - lastTimestamp;
  if (elapsed > 16.6667) {
    updatePhysic();
    draw();
    lastTimestamp = timestamp;
    fps = Math.round(1 / (elapsed/1000));
  }
  window.requestAnimationFrame(gameLoop);
}

function updatePhysic() {
  player.update();
  enemy.update();
  drawPerformance();

}

function handleKeyInput() {
  window.addEventListener('keydown', function(event) {
    if(event.code == "Space") {    
      player.moveAble = false;
    }
  })
  window.addEventListener('keyup', function(event) {
    if(event.code == "Space") {
      player.moveAble = true;   
    }
  })
}

function setMouseEvent() {
  window.addEventListener("mouseover", function(event) {
    canvas.focus();
  });

  canvas.addEventListener("contextmenu", function(event) {
    event.preventDefault();
  });
}

function drawPerformance() {
  mouseX.innerText = `mX: ${Math.round(mouse.x)}`
  mouseY.innerText = `mY: ${Math.round(mouse.y)}`
  fpsSpan.innerText = `FPS: ${fps}`
  xSpan.innerText = `X: ${Math.round(player.location.x)}`
  ySpan.innerText = `Y: ${Math.round(player.location.y)}`
}

function draw() {
  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.save();
  ctx.translate(canvasW/2 - player.location.x,canvasH /2 - player.location.y);
  player.display();
  enemy.display();
  ctx.restore();
}


//maybe only compute if the mousemove is on the canvas if possible
function getMousePosition() {
  canvas.addEventListener("mousemove", function(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.set(event.clientX - rect.left, event.clientY - rect.top);
  });
}

class Entity {
  constructor(x, y) {
    this.location = new Vector(x, y);
    this.velocity = new Vector();
    this.isColliding = false;
  }

  update() {

  }

  display() {

  }

  checkCollision(v) {
    console.log(v)
    if (v.location.x > 20 + this.location.x || this.location.x > 10 + v.location.x 
      || v.location.y > 20 + this.location.y || this.location.y > 10 + v.location.y) {
        this.isColliding = true;
    }
    else {
      this.isColliding = false;
    }
  }

}

class Eel extends Entity {
  constructor(x, y) {
    super(x, y);
    this.rotationAngle = 0;
    this.color = "red";
    this.moveAble = true;
  }
  
  update() {
    // this.rotationAngle = Vector.getAngle(mouse, this.location);
    if(this.moveAble) {
      let directionV = new Vector(mouse.x - canvasW/2, mouse.y - canvasH/2).normalize();
      directionV.multiply(2 );
      this.location.add(directionV);
    }

    this.checkCollision(enemy);
    if(this.isColliding) {
      console.log("colliding");
    }
  }

  display() {
    // ctx.rotate(this.rotationAngle);
    ctx.beginPath();
    ctx.rect(this.location.x - 20, this.location.y - 20, 40, 40);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

class Prey extends Entity {
  constructor(x, y) {
    super(x, y);
    this.acceleration = new Vector(-0.001,0.001);
    this.angle = 0
    this.color = "green";
  }

  update() {
    this.velocity.add(this.acceleration);
    this.location.add(this.velocity);
  }

  display() {
    ctx.beginPath();
    ctx.rect(this.location.x, this.location.y, 20, 20);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}




