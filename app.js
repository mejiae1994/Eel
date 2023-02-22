"use strict";
/** @type {HTMLCanvasElement} */
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
let predator;
let entityCollection = [];
let lastTimestamp = 0;
let fps;

window.onload = init;

function init() {
  player = new Eel(canvasW / 2, canvasH / 2, 40, 40, "red", EntityType.PLAYER);
  mouse = new Vector(0,0);
  for(let i = -400; i <1200 ; i+=100) {
    let nPrey = new Prey(getRandomInt(-canvasW, canvasW * 2), i, 20, 20, "green", EntityType.PREY);
  }
  predator = new Predator(-300, -300, 50, 50, "blue ", EntityType.PREDATOR);

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
  for (let i = 0; i < entityCollection.length; i++) {
    if(entityCollection[i].type === EntityType.PREY) {
      entityCollection[i].update();
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.save();
  ctx.translate(canvasW/2 - player.location.x, canvasH /2 - player.location.y);
  player.display();
  for (let i = 0; i < entityCollection.length; i++) {
    if(entityCollection[i].type === EntityType.PREY) {
      entityCollection[i].display();
    }
  }
  predator.display();
  displayMapBorder();
  displayPerformance();
  ctx.restore();
}

function displayMapBorder() {
  ctx.beginPath();
  ctx.lineWidth = 10;
  ctx.rect(-620, -620, 1845, 1840);
  ctx.stroke();
  ctx.closePath();
}

function handleKeyInput() {
  window.addEventListener('keydown', function(event) {
    if(event.code == "Space") {    
      player.isMoveable = false;
    }
  })
  window.addEventListener('keyup', function(event) {
    if(event.code == "Space") {
      player.isMoveable = true;   
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

function displayPerformance() {
  mouseX.innerText = `mX: ${Math.round(mouse.x)}`
  mouseY.innerText = `mY: ${Math.round(mouse.y)}`
  fpsSpan.innerText = `FPS: ${fps}`
  xSpan.innerText = `X: ${Math.round(player.location.x)}`
  ySpan.innerText = `Y: ${Math.round(player.location.y)}`
}

function getMousePosition() {
  canvas.addEventListener("mousemove", function(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.set(event.clientX - rect.left, event.clientY - rect.top);
  });
}

const EntityType = {
  PLAYER: 'player',
  PREY: 'prey',
  PREDATOR: 'predator'
}

class Entity {
  constructor(x, y, w, h, color, type) {
    this.location = new Vector(x, y);
    this.velocity = new Vector();
    this.width = w;
    this.height = h;
    this.color = color;
    this.type = type;
    this.isColliding = false;

    if(this.type != EntityType.PLAYER) {
      entityCollection.push(this);
    }
  }

  update() {

  }

  display() {
    
  }
}

class Eel extends Entity {
  constructor(x, y, w, h, color, type) {
    super(x, y, w, h, color, type);
    this.rotationAngle = 0;
    this.isMoveable = true;
  }
  
  update() {
    // this.rotationAngle = Vector.getAngle(mouse, this.location);
    if(this.isMoveable) {
      let directionV = new Vector(mouse.x - canvasW/2, mouse.y - canvasH/2).normalize();
      directionV.multiply(6);
      this.location.add(directionV);
    }

    for (let i = 0; i < entityCollection.length; i++) {
      this.checkCollision(entityCollection[i])
      if(entityCollection[i].isColliding && this.isColliding) {
        entityCollection.splice(i, 1);
      }
    }

    //check for boundaries
    if (this.location.x <= -canvasW) {
      this.location.x = -canvasW;
    }
    if(this.location.x >= canvasW * 2) {
      this.location.x = canvasW * 2;
    }
    if(this.location.y <= -canvasH) {
      this.location.y = -canvasH;
    }
    if (this.location.y >= canvasH * 2) {
      this.location.y = canvasH * 2;
    }
  }

  display() {
    // ctx.rotate(this.rotationAngle);
    ctx.beginPath();
    ctx.rect(this.location.x - this.width/2, this.location.y - this.height/2, this.width, this.height);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  checkCollision(entity) {
    if (entity.location.x > this.location.x + this.width ||
        this.location.x > entity.location.x + entity.width ||
        entity.location.y > this.height + this.location.y ||
        this.location.y > entity.height + entity.location.y)
    {
      this.isColliding = false;
    }
    else {
      this.isColliding = true;
      entity.isColliding = true;
      console.log(`player colliding with: ${entity.type}`);
    }
  }
}

class Prey extends Entity {
  constructor(x, y, w, h, color, type) {
    super(x, y, w, h, color, type);
    this.rotationAngle = 0
    this.acceleration = new Vector(-0.005,0.005);
    this.period = 120;
    this.amplitude = getRandomInt(300, canvasW * 2);
  }

  update() {
    // this.location.x = this.amplitude * Math.cos((Math.PI * 2) * )
    // this.velocity.add(this.acceleration);
    // this.rotationAngle = this.velocity.x;
    // this.location.x = this.amplitude * Math.cos(this.rotationAngle);
    // // this.location.add(this.velocity);
    // if (this.location.x <= -canvasW) {
    //   this.location.x = -canvasW;
    // }
  }

  display() {
    ctx.beginPath();
    ctx.rect(this.location.x, this.location.y, this.width, this.height);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

class Predator extends Entity {
  constructor(x, y, w, h, color, type) {
    super(x, y, w, h, color, type);
    this.acceleration = new Vector(-0.001,0.001);
    this.rotationAngle = 0
  }

  update() {
    this.velocity.add(this.acceleration);
    this.location.add(this.velocity);
  }

  display() {
    ctx.beginPath();
    ctx.rect(this.location.x, this.location.y, this.width, this.height);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}




