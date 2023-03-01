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
const eggSpan = document.getElementById("egg");
const matrixStack = [];
let canvasW = canvas.width;
let canvasH = canvas.height;
let player;
let mouse;
let entityCollection = [];
let lastTimestamp = 0;
let fps;
const backgroundImage = new Image();

const GameState = {
  currentLevel: 0,
  gameOver: false,
  level: [
    {
      sharkAmount: 2,
      eggAmount: 10,
      fishAmount: 15,
      trapAmount: 4,
      timeLimit: 60
    },
    {
      sharkAmount: 3,
      eggAmount: 20,
      fishAmount: 30,
      trapAmount: 6,
      timeLimit: 60
    },
    {
      sharkAmount: 5,
      eggAmount: 30,
      fishAmount: 60,
      trapAmount: 10,
      timeLimit: 60
    }
  ]
}

const spriteUrl = {
  background: "./sprite/gametile.png",
  fish: "./sprite/fish.png",
  shark: "./sprite/shark.png",
  eel: "./sprite/eel.png",
  egg: "./sprite/egg.png",
  trap: "./sprite/trap.png"
}

const EntityType = {
  PLAYER: "player",
  PREY: "prey",
  PREDATOR: "predator",
  EGG: "egg",
  TRAP: "trap"
}

window.onload = init;

function init() {
  backgroundImage.src = spriteUrl.background;

  let spawnDistance = [-(canvasW - 100), (canvasH * 2 - 100)];

  mouse = new Vector(0,0);
  player = new Eel(canvasW / 2, canvasH / 2, 16, 32, EntityType.PLAYER, spriteUrl.eel);

  let currentLevel = GameState.level[GameState.currentLevel]
  for (let i = 0; i < currentLevel.eggAmount; i++) {
    let egg = new Egg(getRandomNumber(spawnDistance[0], spawnDistance[1]), getRandomNumber(spawnDistance[0], spawnDistance[1]), 8, 8, EntityType.EGG, spriteUrl.egg);
  }

  for(let i = 0; i < currentLevel.sharkAmount; i++) {
    let predator = new Predator(getRandomNumber(spawnDistance[0], spawnDistance[1]), getRandomNumber(spawnDistance[0], spawnDistance[1]), 48, 64, EntityType.PREDATOR, spriteUrl.shark); 
  }

  for(let i = 0; i < currentLevel.fishAmount; i++) {
    let fish = new Fish(getRandomNumber(spawnDistance[0], spawnDistance[1]), getRandomNumber(spawnDistance[0], spawnDistance[1]), 24, 24, EntityType.PREDATOR, spriteUrl.fish);
  }

  for(let i = 0; i < currentLevel.trapAmount; i++) {
    let trap = new Trap(getRandomNumber(spawnDistance[0] + 300, spawnDistance[1] - 300), getRandomNumber(spawnDistance[0], spawnDistance[1]), 16, 16, EntityType.TRAP, spriteUrl.trap);
  }
  
  handleKeyInput();
  setMouseEvent();
  getMousePosition();
  // window.requestAnimationFrame(gameLoop);
  gameLoop();
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
  entityUpdate();
}

function draw() {
  ctx.clearRect(0, 0, canvasW, canvasH);
  
  push();
  player.display();
  displayBackground();

  for (let i = 0; i < entityCollection.length; i++) {
    if(entityCollection[i].type !== EntityType.PLAYER) {
      entityCollection[i].display();
    }
  }
  
  displayMapBorder();
  displayPerformance();
  pop();
}

function displayGameOver(x, y) {
  ctx.fillStyle = "white";
  ctx.font = "50px serif";
  ctx.fillText("Game Over", x, y);
}

function entityUpdate() {
  for (let i = 0; i < entityCollection.length; i++) {
    if(entityCollection[i].type === EntityType.PREDATOR) {
      entityCollection[i].wanderOrSeek(player.position);
      entityCollection[i].update();
    }
  }
}

function getEggsCollected() {
  let total = 0;
  
  for (let i = 0; i < entityCollection.length;i++) {
    if(entityCollection[i].type === EntityType.EGG) {
      total++;
    }
  }
  return total;
}

function darken() {
  ctx.fillStyle = "black";
  ctx.globalAlpha = 0.2;
  ctx.fillRect(-canvasW - 20, - canvasH - 20, canvasW * 3 + 45, canvasH * 3 + 40);
  ctx.globalAlpha = 1;
}

function displayBackground() {
  const ptrn = ctx.createPattern(backgroundImage, 'repeat'); // Create a pattern with this image, and set it to "repeat".
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = ptrn;
  ctx.fillRect(-canvasW, - canvasH, canvasW * 3, canvasH * 3);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(12, 12, 106, 0.32)"
  ctx.fillRect(-canvasW, - canvasH, canvasW * 3, canvasH * 3);
  // darken();
}

function displayMapBorder() {
  ctx.beginPath();
  ctx.strokeStyle = "red"
  ctx.lineWidth = 10;
  ctx.rect(-canvasW, -canvasW, canvasW * 3, canvasH * 3);
  ctx.stroke();
  ctx.closePath();
}

function displayPerformance() {
  mouseX.innerText = `mX: ${Math.round(mouse.x)}`
  mouseY.innerText = `mY: ${Math.round(mouse.y)}`
  fpsSpan.innerText = `FPS: ${fps}`
  xSpan.innerText = `X: ${Math.round(player.position.x)}`
  ySpan.innerText = `Y: ${Math.round(player.position.y)}`
  eggSpan.innerText = `Remaining eggs: ${getEggsCollected()}`
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

const PredatorState = {
  WANDERING: 'wandering',
  SEEKING: 'seeking'
}

class Entity {
  constructor(x, y, w, h, type, color) {
    this.position = new Vector(x, y);
    this.velocity = new Vector();
    this.acceleration = new Vector(0,0);
    this.rotationAngle = 0
    this.width = w;
    this.height = h;
    this.sprite;
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

  //check for boundaries
  checkBoundaries() {
    if (this.position.x - this.width / 2 <= -canvasW) {
      this.velocity.multiply(-1);
    } else if (this.position.x >= canvasW * 2 - this.width) {
      this.velocity.multiply(-1);
    }
    if (this.position.y - this.height / 2 <= -canvasH) {
      this.velocity.multiply(-1);
    } else if (this.position.y >= canvasH * 2 - this.height) {
      this.velocity.multiply(-1);
    }
  }
}

class Trap extends Entity {
  constructor(x, y, w, h, type, imgSrc) {
    super(x, y, w, h, type);
    this.row = 0;
    this.col = 0;
    this.imageSrc = imgSrc;
    this.loadImg();
  }

  loadImg() {
    if(!this.sprite) {
      this.sprite = new Image();

      this.sprite.src = this.imageSrc;
      // this.assignSpriteAnimation();
    }
  }
  
  display() {
    ctx.drawImage(this.sprite, this.row, 
    this.col, this.width, this.height, 
    this.position.x, this.position.y, this.width * 1.5, this.height * 1.5);
  }
}

class Egg extends Entity {
  constructor(x, y, w, h, type, imgSrc) {
    super(x, y, w, h, type);
    this.row = 0;
    this.col = 0;
    this.imageSrc = imgSrc;
    this.loadImg();
  }

  loadImg() {
    if(!this.sprite) {
      this.sprite = new Image();

      this.sprite.src = this.imageSrc;
      // this.assignSpriteAnimation();
    }
  }
  
  display() {
    ctx.drawImage(this.sprite, this.row, 
    this.col, this.width, this.height, 
    this.position.x, this.position.y, this.width, this.height);
  }
}

class Eel extends Entity {
  constructor(x, y, w, h, type, imgSrc) {
    super(x, y, w, h, type);
    this.isMoveable = true;
    this.row = 0;
    this.col = 0;
    this.maxSpeed = 3;
    this.maxForce = 0.2;
    this.imageSrc = imgSrc;
    this.elapsedFrames = 0;
    this.frameBufer = 6;
    this.isTrapped = false;
    this.alive = true;

    this.spriteAnimation = [];
    this.animationState = [
      {
        name: 'wandering',
        frames: 4
      }
    ];

    this.loadImg();
  }
  
  loadImg() {
    if(!this.sprite) {
      this.sprite = new Image();

      this.sprite.src = this.imageSrc;
      this.assignSpriteAnimation();
    }
  }

  //handle sprite animations
  assignSpriteAnimation() {
    this.animationState.forEach((state, index) => {
      let frames = {
        loc: [],
      }
      for (let j = 0; j < state.frames; j++) {
        let positionX = j * this.width;
        let positionY = index * this.height;
        frames.loc.push({x: positionX, y: positionY});
      }
      this.spriteAnimation[state.name] = frames;
    })
  }

  update() {
    this.animate();
    if(this.isMoveable) {
      let steer = this.seek(new Vector(mouse.x - canvasW/2, mouse.y - canvasH/2));
      this.applyForce(steer);
      this.velocity.add(this.acceleration);
      if(this.isTrapped) {
        this.maxSpeed = 1.5;
      } else {
        this.maxSpeed = 3;
      }
      this.velocity.limit(this.maxSpeed);
      this.position.add(this.velocity);
      this.rotationAngle = 180 * Vector.getVelocityAngle(this.velocity) / Math.PI;
    }

    this.handleEntityCollection();
    this.checkBoundaries();
  }

  handleEntityCollection() {
    this.isTrapped = false;
    for (let i = 0; i < entityCollection.length; i++) {
      this.checkCollision(entityCollection[i])
      if (entityCollection[i].type === EntityType.EGG && entityCollection[i].isColliding && this.isColliding) {
        entityCollection.splice(i, 1);
      }
      else if (entityCollection[i].type === EntityType.PREDATOR && entityCollection[i].isColliding && this.isColliding)  {
        // console.log(`colliding with ${JSON.stringify(entityCollection[i])}`);
        this.alive = false;
      }
    }
  }

  animate() {
    let position = Math.floor(this.elapsedFrames/this.frameBufer) % this.spriteAnimation["wandering"].loc.length;
    this.row = this.width * position;
    this.col = this.spriteAnimation["wandering"].loc[position].y
  }

  seek(force) { 
    force.setMag(this.maxSpeed);
    force.subtract(this.velocity)
    force.limit(this.maxForce);
    return force;
  }

  display() {
    push();
    //translate canvas to middle of player and screen
    ctx.translate(canvasW/2 - (player.position.x), canvasH /2 - (player.position.y));
    if(!this.alive) {
      displayGameOver(this.position.x - 120, this.position.y);
    }
    push();
    ctx.translate(this.position.x + this.width / 2, this.position.y + this.height / 2)
    ctx.rotate(Math.PI / 180 * (this.rotationAngle + 90));
    ctx.translate(-(this.position.x + this.width / 2), -(this.position.y + this.height / 2));
    ctx.drawImage(this.sprite, this.row, 
      this.col, this.width, this.height,
      this.position.x, this.position.y, this.width, this.height);
    pop();
    this.elapsedFrames++;
  }

  checkCollision(entity) {
    if (entity.position.x > this.position.x + this.width||
      this.position.x > entity.position.x + entity.width||
      entity.position.y > this.height + this.position.y ||
      this.position.y > entity.height+ entity.position.y)
    {
      this.isColliding = false;
    }
    else {
      this.isColliding = true;
      entity.isColliding = true;
      if(entity.type === EntityType.TRAP) {
        this.isTrapped = true;
      }
    }
  }

  checkBoundaries() {
    //check for boundaries
    if (this.position.x - this.width / 2 <= -canvasW) {
      this.position.x = -canvasW + this.width / 2;
    }
    if(this.position.x >= canvasW * 2 - this.width - 8) {
      this.position.x = canvasW * 2 - this.width - 8;
    }
    if(this.position.y <= -canvasH) {
      this.position.y = -canvasH;
    }
    if (this.position.y >= canvasH * 2 - this.height) {
      this.position.y = canvasH * 2 - this.height;
    }
  }
}

class Fish extends Entity {
  constructor(x, y, w, h, type, imgSrc) {
    super(x, y, w, h, type)
    this.maxSpeed = 2;
    this.maxForce = 0.05;
    this.imageSrc = imgSrc;
    this.col = 0;
    this.row = 0;
    this.r = 6
    this.state = PredatorState.WANDERING;
    this.wanderTheta = Math.PI/ 2;
    this.elapsedFrames = 0;
    this.frameBufer = 6;
    
    this.spriteAnimation = [];
    this.animationState = [
      {
        name: 'wandering',
        frames: 4
      }
    ];
    this.loadImg();

  }

  loadImg() {
    if(!this.sprite) {
      this.sprite = new Image();

      this.sprite.src = this.imageSrc;
      this.assignSpriteAnimation();
    }
  }

  //handle sprite animations
  assignSpriteAnimation() {
    this.animationState.forEach((state, index) => {
      let frames = {
        loc: [],
      }
      for (let j = 0; j < state.frames; j++) {
        let positionX = j * this.width;
        let positionY = index * this.height;
        frames.loc.push({x: positionX, y: positionY});
      }
      this.spriteAnimation[state.name] = frames;
    })
  }

  wanderOrSeek() {
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
    this.animate();
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.position.add(this.velocity);
    this.rotationAngle = 180 * Vector.getVelocityAngle(this.velocity) / Math.PI;
    this.acceleration.set(0, 0);
    this.checkBoundaries();
  }

  animate() {
    let position = Math.floor(this.elapsedFrames/this.frameBufer) % this.spriteAnimation[this.state].loc.length;
    this.row = this.width * position;
    this.col = this.spriteAnimation[this.state].loc[position].y
  }

  display() {
    push();
    ctx.translate(this.position.x, this.position.y)
    ctx.rotate(Math.PI / 180 * (this.rotationAngle + 90));
    ctx.translate(-this.position.x, -this.position.y)
    ctx.drawImage(this.sprite, this.row,
      this.col, this.width, this.height, 
      this.position.x, this.position.y, this.width, this.height);
    pop();
    this.elapsedFrames++;
  }
}

class Predator extends Entity {
  constructor(x, y, w, h, type, imgSrc) {
    super(x, y, w, h, type);
    this.imageSrc = imgSrc;
    this.maxSpeed = 2.5;
    this.maxForce = 0.1;
    this.r = 6
    this.state = PredatorState.WANDERING;
    this.wanderTheta = Math.PI/ 2;
    this.col = 0;
    this.row = 0;
    this.elapsedFrames = 0;
    this.frameBufer = 6;
    
    this.spriteAnimation = [];
    this.animationState = [
      {
        name: 'wandering',
        frames: 8
      }
    ];
    this.loadImg();    
  }

  loadImg() {
    if(!this.sprite) {
      this.sprite = new Image();

      this.sprite.src = this.imageSrc;
      this.assignSpriteAnimation();
    }
  }

  //handle sprite animations
  assignSpriteAnimation() {
    this.animationState.forEach((state, index) => {
      let frames = {
        loc: [],
      }
      for (let j = 0; j < state.frames; j++) {
        let positionX = j * this.width;
        let positionY = index * this.height;
        frames.loc.push({x: positionX, y: positionY});
      }
      this.spriteAnimation[state.name] = frames;
    })
  }

  update() {
    this.animate();
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.position.add(this.velocity);
    this.rotationAngle = 180 * Vector.getVelocityAngle(this.velocity) / Math.PI;
    this.acceleration.set(0, 0);
    this.checkBoundaries();
  }

  animate() {
    let position = Math.floor(this.elapsedFrames/this.frameBufer) % this.spriteAnimation["wandering"].loc.length;
    this.row = this.width * position;
    this.col = this.spriteAnimation["wandering"].loc[position].y
  }

  display() {
    push();
    ctx.translate(this.position.x + this.width / 2, this.position.y + this.height /2)
    ctx.rotate(Math.PI / 180 * (this.rotationAngle + 90));
    ctx.translate(-(this.position.x + this.width / 2), -(this.position.y + this.height /2))
    ctx.drawImage(this.sprite, this.row, 
      this.col, this.width, this.height,
      this.position.x, this.position.y, this.width , this.height);
    pop();
    
    //temporary debug circle
    // this.displayRadius();
    this.elapsedFrames++;
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
    let wanderPoint = this.velocity.clone();
    wanderPoint.setMag(100);
    
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
    ctx.arc(this.position.x + this.width / 2, this.position.y + this.height / 2, this.r * 40, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(165, 40, 40, 0.12)"
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
  }
}

const variableToString = varObj => Object.keys(varObj)[0]
function log(variable, data) {
  console.log(`${variable} value is: ${JSON.stringify(data)}`)
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

function transparentRect(x, y, w, h) {
  ctx.beginPath();
  ctx.fillStyle = "rgba(255,200,200,0.2)";
  ctx.fillRect(x, y, w, h)
}