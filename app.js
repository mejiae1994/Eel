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

window.onload = init;

function init() {
  mouse = new Vector(0,0);
  player = new Eel(canvasW / 2, canvasH / 2, 40, 40, "red", EntityType.PLAYER);
  for(let i = -400; i <1200 ; i+=100) {
    let nPrey = new Prey(getRandomInt(-canvasW, canvasW * 2), i, 20, 20, "green", EntityType.PREY);
  }
  predator = new Predator(600, 600, 20, 20, "orange", EntityType.PREDATOR);

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
  player.display();
  
  // prey.display();
  for (let i = 0; i < entityCollection.length; i++) {
    if(entityCollection[i].type === EntityType.PREY) {
      entityCollection[i].display();
    }
  }
  predator.display();
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
  canvas.addEventListener('mousedown', function(event) {
    if(event.which === 1) {
      player.isMoveable = false;
    }
  })

  canvas.addEventListener('mouseup', function(event) {
    if(event.which === 1) {
      player.isMoveable = true;
    }
  })

  // window.addEventListener('keydown', function(event) {
  //   if(event.code == "Space") {    
  //     player.isMoveable = false;
  //   }
  // })
  // window.addEventListener('keyup', function(event) {
  //   if(event.code == "Space") {
  //     player.isMoveable = true;   
  //   }
  // })
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

  update() {

  }

  display() {
    
  }

  checkBoundaries() {
    if (this.position.x <= -canvasW) {
      this.velocity.multiply(-1);
    }
    if(this.position.x >= canvasW * 2) {
      this.velocity.multiply(-1);
    }
    if(this.position.y <= -canvasH) {
      this.velocity.multiply(-1);
    }
    if (this.position.y >= canvasH * 2) {
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
      // console.log(`player at: ${JSON.stringify(this.position)} colliding with entity at: ${JSON.stringify(entity.position)}`);
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
    this.acceleration = new Vector(0,0);
    this.maxSpeed = 4;
    this.maxForce = 0.2;
    this.r = 6

    this.wanderTheta = Math.PI / 2;
  }

  wander() {
    let force = new Vector(getRandomInt(-1,1),getRandomInt(-1,1));
    this.applyForce(force.multiply(.1));
    // let wanderPoint = this.position.clone();
    // wanderPoint.setMag(100);
    // wanderPoint.add(this.position);
    // ctx.beginPath();
    // ctx.fillStyle = "blue"
    // ctx.arc(wanderPoint.x, wanderPoint.y, 4, 0, 2 * Math.PI);
    // ctx.fill();
    // ctx.closePath();

    // let wanderRadius = 32
    // ctx.beginPath();
    // ctx.arc(wanderPoint.x, wanderPoint.y, wanderRadius, 0, 2 * Math.PI);
    // ctx.stroke();

    // console.log(getAngle(this.velocity));
    // let theta = this.wanderTheta + getAngle(this.velocity);

    // let x = wanderRadius * Math.cos(theta);
    // let y = wanderRadius * Math.sin(theta);
    // wanderPoint.add(new Vector(x, y));
    // ctx.beginPath();
    // ctx.fillStyle = "green"
    // ctx.arc(wanderPoint.x, wanderPoint.y, 8, 0, 2 * Math.PI);
    // ctx.fill();

    // let steer = wanderPoint.subtract(this.position);
    // steer.setMag(this.maxForce);
    // this.applyForce(steer);

    // let displaceRange = 0.3;
    // this.wanderTheta += getRandomInt(-displaceRange, displaceRange);
  }

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.position.add(this.velocity);
    this.acceleration.set(0, 0);
    // console.log(this.velocity)
    this.checkBoundaries();
  }

  display() {
    ctx.beginPath();
    ctx.rect(this.position.x, this.position.y, this.width, this.height);
    ctx.fillStyle = this.color;
    ctx.fill(); 
  }
}

class Predator extends Entity {
  constructor(x, y, w, h, color, type) {
    super(x, y, w, h, color, type);
    this.rotationAngle = 0
    this.acceleration = new Vector(0,0);
    this.maxSpeed = 4;
    this.maxForce = 0.2;
    this.r = 6
    this.state = PredatorState.WANDERING;
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
      // console.log(`Changed state to ${this.state}: distance from predator to player ${targetDistance}`)
    } else if (targetDistance > (this.r * 40) * 1.5) {
      this.state = PredatorState.WANDERING;
    }
  }

  wander() {
    let force = new Vector(getRandomInt(-1,1),getRandomInt(-1,1));
    this.applyForce(force.multiply(.2));
  }

  wanderOrSeek(target) {
    this.huntForPlayer(target);

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