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
const matrixStack = [];
let canvasW = canvas.width;
let canvasH = canvas.height;
let player;
let mouse;
let predator;
let entityCollection = [];
let lastTimestamp = 0;
let fps;
let oneFish;
const backgroundImage = new Image();

const spriteAnimations = [];
const animationStates = [
  {
    name: 'wandering',
    frames: 4
  }
];

//handle sprite animations
function assignSpriteAnimations(w, h) {
  animationStates.forEach((state, index) => {
    let frames = {
      loc: [],
    }
    for (let j = 0; j < state.frames; j++) {
      let positionX = j * w;
      let positionY = index * h;
      frames.loc.push({x: positionX, y: positionY});
    }
    spriteAnimations[state.name] = frames;
  })
}

window.onload = init;

function init() {
  backgroundImage.src = './sprite/gametile.png';
  mouse = new Vector(0,0);
  player = new Eel(canvasW / 2, canvasH / 2, 40, 40, "red", EntityType.PLAYER);
  for(let i = -400; i <1200 ; i+=100) {
    let nPrey = new Prey(getRandomInt(-canvasW, canvasW * 2), i, 20, 20, "green", EntityType.PREY);
  }
  predator = new Predator(350, 350, 20, 20, "orange", EntityType.PREDATOR);
  oneFish = new Fish(350,350, 24, 24);

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

  predator.wanderOrSeek(player.position);
  predator.update();
  oneFish.wander();
  oneFish.update();

  for (let i = 0; i < entityCollection.length; i++) {
    if(entityCollection[i].type === EntityType.PREY) {
      entityCollection[i].wander();
      entityCollection[i].update();
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvasW, canvasH);
  
  push();
  const ptrn = ctx.createPattern(backgroundImage, 'repeat'); // Create a pattern with this image, and set it to "repeat".
  ctx.fillStyle = ptrn;
  ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.fillStyle = "rgba(12, 12, 106, 0.32)"
  ctx.fillRect(0, 0, canvasW, canvasH);
  player.display();
  
  // prey.display();
  for (let i = 0; i < entityCollection.length; i++) {
    if(entityCollection[i].type === EntityType.PREY) {
      entityCollection[i].display();
    }
  }
  predator.display();
  oneFish.display();
  displayMapBorder();
  displayPerformance();
  pop();
}

function displayMapBorder() {
  ctx.beginPath();
  ctx.strokeStyle = "magenta"
  ctx.lineWidth = 10;
  ctx.rect(-620, -620, 1845, 1840);
  ctx.stroke();
  ctx.closePath();
}

function displayPerformance() {
  mouseX.innerText = `mX: ${Math.round(mouse.x)}`
  mouseY.innerText = `mY: ${Math.round(mouse.y)}`
  fpsSpan.innerText = `FPS: ${fps}`
  xSpan.innerText = `X: ${Math.round(player.position.x)}`
  ySpan.innerText = `Y: ${Math.round(player.position.y)}`
}

function handleKeyInput() {
  canvas.addEventListener('click', function(event) {
    if(event.button === 0) {
      player.isMoveable = !player.isMoveable;
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

const PredatorState = {
  WANDERING: 'wandering',
  SEEKING: 'seeking'
}

class Entity {
  constructor(x, y, w, h, color, type) {
    this.position = new Vector(x, y);
    this.velocity = new Vector();
    this.acceleration = new Vector(0,0);
    this.width = w;
    this.height = h;
    this.color = color;
    this.type = type;
    this.isColliding = false;

    if(this.type != EntityType.PLAYER) {
      entityCollection.push(this);
    }
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  checkBoundaries() {
    if (this.position.x <= -canvasW) {
      this.velocity.multiply(-1);
    } else if (this.position.x >= canvasW * 2) {
      this.velocity.multiply(-1);
    }
    if (this.position.y <= -canvasH) {
      this.velocity.multiply(-1);
    } else if (this.position.y >= canvasH * 2) {
      this.velocity.multiply(-1);
    }
  }
}

class Eel extends Entity {
  constructor(x, y, w, h, color, type) {
    super(x, y, w, h, color, type);
    this.rotationAngle = 0;
    this.isMoveable = true;
  }
  
  update() {
    // this.rotationAngle = Vector.getAngle(mouse, this.position);
    if(this.isMoveable) {
      let directionV = new Vector(mouse.x - canvasW/2, mouse.y - canvasH/2).normalize();
      directionV.multiply(6);
      this.position.add(directionV);
    }

    for (let i = 0; i < entityCollection.length; i++) {
      this.checkCollision(entityCollection[i])
      if(entityCollection[i].isColliding && this.isColliding) {
        entityCollection.splice(i, 1);
      }
    }

    this.checkBoundaries();
  }

  display() {
    // ctx.rotate(this.rotationAngle);
    ctx.translate(canvasW/2 - player.position.x, canvasH /2 - player.position.y);
    ctx.beginPath();
    ctx.rect(this.position.x - this.width/2, this.position.y - this.height/2, this.width, this.height);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }

  checkCollision(entity) {
    if (entity.position.x > this.position.x + this.width ||
        this.position.x > entity.position.x + entity.width ||
        entity.position.y > this.height + this.position.y ||
        this.position.y > entity.height + entity.position.y)
    {
      this.isColliding = false;
    }
    else {
      this.isColliding = true;
      entity.isColliding = true;
    }
  }

  checkBoundaries() {
    //check for boundaries
    if (this.position.x <= -canvasW) {
      this.position.x = -canvasW;
    }
    if(this.position.x >= canvasW * 2) {
      this.position.x = canvasW * 2;
    }
    if(this.position.y <= -canvasH) {
      this.position.y = -canvasH;
    }
    if (this.position.y >= canvasH * 2) {
      this.position.y = canvasH * 2;
    }
  }
}

class Prey extends Entity {
  constructor(x, y, w, h, color, type) {
    super(x, y, w, h, color, type);
    this.rotationAngle = 0
    this.maxSpeed = 4;
    this.maxForce = 0.2;
    this.r = 6

    this.wanderTheta = Math.PI / 2;
  }

  wander() {
    let force = new Vector(getRandomNumber(-0.8,0.8),getRandomNumber(-0.8,0.8));
    this.applyForce(force.multiply(.1));
  }

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.position.add(this.velocity);
    this.acceleration.set(0, 0);
    this.checkBoundaries();
  }

  display() {
    ctx.beginPath();
    ctx.rect(this.position.x, this.position.y, this.width, this.height);
    ctx.fillStyle = this.color;
    ctx.fill(); 
  }
}

class Fish extends Entity {
  constructor(x, y, w, h) {
    super(x, y, w, h)
    this.rotationAngle = 0
    this.maxSpeed = 2;
    this.maxForce = 0.05;
    this.sprite;
    this.col = 0;
    this.row = 0;
    this.frameW = 24;
    this.frameH = 24;
    this.loadImg();
    this.r = 6
    this.elapsedFrames = 0;

    this.wanderTheta = Math.PI/ 2;
  }

  loadImg() {
    if(!this.sprite) {
      console.log(`loading image`);
      this.sprite = new Image();

      this.sprite.onload = () => {
        this.width = this.sprite.width;
        this.height = this.sprite.height;
      }

      this.sprite.src = './sprite/fish.png';
    }
  }

  wander() {
    // let force = new Vector(getRandomNumber(-0.8,0.8),getRandomNumber(-0.8,0.8));
    // this.applyForce(force.multiply(.1));

    let wanderPoint = this.velocity.clone();
    wanderPoint.setMag(150);
    let wanderRadius = 30

    let theta = this.wanderTheta + Vector.getVelocityAngle(this.velocity);
    let x = wanderRadius * Math.cos(theta);
    let y = wanderRadius * Math.sin(theta);
    wanderPoint.add(new Vector(x, y));

    wanderPoint.setMag(this.maxForce);
    this.applyForce(wanderPoint);
   
    let displaceRange = 0.2;
    this.wanderTheta += getRandomNumber(-displaceRange, displaceRange);
  }

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.position.add(this.velocity);
    this.rotationAngle = 180 * Vector.getVelocityAngle(this.velocity) / Math.PI;
    this.acceleration.set(0, 0);
    this.checkBoundaries();
  }

  display() {
    this.elapsedFrames++;
    push();
    ctx.translate(this.position.x, this.position.y)
    ctx.rotate(Math.PI / 180 * (this.rotationAngle + 90));
    ctx.translate(-this.position.x, -this.position.y)
    ctx.drawImage(this.sprite, this.col * this.frameW, 
      this.row * this.frameH, this.frameW, this.frameH, 
      this.position.x, this.position.y, this.frameW * 1.25, this.frameH * 1.25);
    // ctx.drawImage(this.sprite, this.position.x, this.position.y, this.width, this.height);    
    // ctx.drawImage(this.sprite, this.col * this.frameW, this.row * this.frameH, this.frameW, this.frameH, this.position.x, this.position.y, this.frameW, this.frameH);
    pop();
  }
}

const variableToString = varObj => Object.keys(varObj)[0]
function log(variable, data) {
  console.log(`${variable} value is: ${JSON.stringify(data)}`)
}

class Predator extends Entity {
  constructor(x, y, w, h, color, type) {
    super(x, y, w, h, color, type);
    this.rotationAngle = 0
    this.maxSpeed = 2;
    this.maxForce = 0.1;
    this.r = 6
    this.state = PredatorState.WANDERING;
    this.wanderTheta = Math.PI/ 2;
  }

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.position.add(this.velocity);
    this.acceleration.set(0, 0);

    this.checkBoundaries(); 
  }

  display() {
    push();
    ctx.translate(this.position.x, this.position.y)
    ctx.rotate(Vector.getVelocityAngle(this.velocity))
    ctx.strokeStyle = "black" 
    triangle(-this.r, -this.r/2, -this.r, this.r/2, this.r, 0)
    pop();
    
    //temporary debug circle
    this.displayRadius();
  }

  huntForPlayer(target) {
    let targetDistance = this.position.distanceTo(target)
    // check if player is inside the radius of the predator
    if(this.state == PredatorState.WANDERING && targetDistance < this.r * 40) {
      this.state = PredatorState.SEEKING;
    } else if (targetDistance > (this.r * 40) * 1.5) {
      this.state = PredatorState.WANDERING;
    }
  }

  //fix the fact that the predator is always going towards the same trajectory
  wander() {
    // let force = new Vector(getRandomInt(-1,1),getRandomInt(-1,1));
    // this.applyForce(force.multiply(.2));

    let wanderPoint = this.velocity.clone();
    wanderPoint.setMag(100);
    // ctx.beginPath();
    // ctx.fillStyle = "blue"
    // ctx.arc(wanderPoint.x, wanderPoint.y, 8, 0, 2 * Math.PI);
    // ctx.fill();
    // ctx.closePath();
    let wanderRadius = 30
    // ctx.beginPath();
    // ctx.arc(wanderPoint.x, wanderPoint.y, wanderRadius, 0, 2 * Math.PI);
    // ctx.stroke();

    let theta = this.wanderTheta + Vector.getVelocityAngle(this.velocity);
    let x = wanderRadius * Math.cos(theta);
    let y = wanderRadius * Math.sin(theta);
    wanderPoint.add(new Vector(x, y));

    // ctx.beginPath();
    // ctx.fillStyle = "green"
    // ctx.arc(wanderPoint.x, wanderPoint.y, 8, 0, 2 * Math.PI);
    // ctx.fill();

    wanderPoint.setMag(this.maxForce);
    this.applyForce(wanderPoint);
   
    let displaceRange = 0.2;
    this.wanderTheta += getRandomNumber(-displaceRange, displaceRange);
  }

  wanderOrSeek(target) {
    this.huntForPlayer(target)

    if(this.state === PredatorState.WANDERING) {
      this.wander();
    } else if(this.state == PredatorState.SEEKING) {
      this.applyForce(this.seek(target));
    }
  }

  flee(target) {
    return this.seek(target).multiply(-1);
  }

  seek(target) { 
    let force = Vector.subVector(target, this.position);
    force.setMag(this.maxSpeed);
    force.subtract(this.velocity)
    force.limit(this.maxForce);
    return force;
  }

  displayRadius() {
    ctx.beginPath();
    ctx.strokeStyle = "red"
    ctx.lineWidth = 2;
    ctx.arc(this.position.x, this.position.y, this.r * 40, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(165, 40, 40, 0.12)"
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
  }
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function getRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

function push() {
  // Save the current transformation matrix onto the stack
  const currentMatrix = ctx.getTransform();
  matrixStack.push(currentMatrix);
}

function pop() {
  // Restore the previous transformation matrix from the stack
  const previousMatrix = matrixStack.pop();
  ctx.setTransform(previousMatrix);
}

function triangle(x1, y1, x2, y2, x3, y3) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.stroke();
}