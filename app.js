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
const startButton = document.getElementById("start");
const gameText = document.getElementById("game");

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
  eggsRemaining: 0,
  level: [
    {
      sharkAmount: 2,
      eggAmount: 1,
      fishAmount: 20,
      trapAmount: 6,
      timeLimit: 60
    },
    {
      sharkAmount: 4,
      eggAmount: 1,
      fishAmount: 30,
      trapAmount: 12,
      timeLimit: 60
    },
    {
      sharkAmount: 6,
      eggAmount: 1,
      fishAmount: 40,
      trapAmount: 18,
      timeLimit: 60
    },
    {
      sharkAmount: 8,
      eggAmount: 1,
      fishAmount: 50,
      trapAmount: 24,
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

window.onload = () => {
  startButton.addEventListener("click", () => {
    GameState.gameOver = false;
    GameState.currentLevel = 0;
    entityCollection = [];
    init();
    startButton.style.display = "none";
    eggSpan.style.display = "inline-block"
    gameText.style.display = "none";
  })
}

function loadNextLevel() {
  entityCollection = [];
  GameState.currentLevel++;
  init();
}
// window.onload = init;

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
  if(!GameState.gameOver) {
    if (elapsed > 16.6667) {
      shouldNextLevelLoad();
      updatePhysic();
      draw();
      lastTimestamp = timestamp;
      fps = Math.round(1 / (elapsed/1000));
    } 
  } else {
    startButton.innerText = "Play Again"
    startButton.style.display = "inline-block"
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

function entityUpdate() {
  for (let i = 0; i < entityCollection.length; i++) {
    if(entityCollection[i].type === EntityType.PREDATOR) {
      entityCollection[i].wanderOrSeek(player.position);
      entityCollection[i].update();
    }
  }
}

function shouldNextLevelLoad() {
  let eggs = entityCollection.filter((entity)=> {
    return entity.type === EntityType.EGG;
  })
  GameState.eggsRemaining = eggs.length;
  
  if (eggs.length === 0 && GameState.currentLevel < GameState.level.length - 1) {
    loadNextLevel();
  } else if (eggs.length === 0 && GameState.currentLevel === GameState.level.length - 1) {
    displayGameText("Good Job! You beat all the levels");
    GameState.gameOver = true;
  }
}

function displayGameText(msg) {
  gameText.innerText = msg;
  gameText.style.display = "inline-block";
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
  eggSpan.innerText = `Remaining eggs: ${GameState.eggsRemaining}`
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
    this.color = "rgba(255,200,200,0.2)";

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
      this.rotationAngle = Math.PI / 180 * (this.rotationAngle + 90);
    }

    this.handleEntityCollection();
    this.checkBoundaries();
  }

  handleEntityCollection() {
    this.isTrapped = false;
    for (let i = 0; i < entityCollection.length; i++) {
      if (detectRectangleCollision(this, entityCollection[i])) {
        console.log(`collision happening: ${JSON.stringify(this.type)} and ${JSON.stringify(entityCollection[i].type)} `)
        if (entityCollection[i].type === EntityType.EGG) {
          entityCollection.splice(i, 1);
        }
        else if(entityCollection[i].type === EntityType.PREDATOR) {
          this.alive = false;
          GameState.gameOver = true;
          displayGameText("Game Over")
        }
        else if(entityCollection[i].type == EntityType.TRAP) {
          this.isTrapped = true;
        }
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
    push();
    ctx.translate(this.position.x + this.width / 2, this.position.y + this.height / 2)
    ctx.rotate(this.rotationAngle);
    ctx.translate(-(this.position.x + this.width / 2), -(this.position.y + this.height / 2));
    if(this.rotationAngle > 360 || this.rotationAngle < -360) this.currRotation = 0;
    // transparentRect(this.position.x, this.position.y, this.width, this.height, this.color);
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
    this.rotationAngle = Math.PI / 180 * (this.rotationAngle + 90);
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
    ctx.translate(this.position.x + this.width / 2, this.position.y + this.height /2)
    ctx.rotate(this.rotationAngle);
    ctx.translate(-(this.position.x + this.width / 2), -(this.position.y + this.height /2))
    if(this.rotationAngle > 360 || this.rotationAngle < -360) this.currRotation = 0;
    // transparentRect(this.position.x, this.position.y, this.width, this.height);
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
    this.rotationAngle = Math.PI / 180 * (this.rotationAngle + 90);
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
    ctx.rotate(this.rotationAngle);
    ctx.translate(-(this.position.x + this.width / 2), -(this.position.y + this.height /2))
    if(this.rotationAngle > 360 || this.rotationAngle < -360) this.currRotation = 0;
    // transparentRect(this.position.x, this.position.y, this.width, this.height);
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

function transparentRect(x, y, w, h, color) {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h)
}


function detectRectangleCollision(playerRect, otherRect){
  let tRR = getRotatedSquareCoordinates(playerRect);
  let oRR = getRotatedSquareCoordinates(otherRect);

  let thisTankVertices = [
      new xy(tRR.tr.x, tRR.tr.y),
      new xy(tRR.br.x, tRR.br.y),
      new xy(tRR.bl.x, tRR.bl.y),
      new xy(tRR.tl.x, tRR.tl.y),
  ];
  let thisTankEdges = [
      new xy(tRR.br.x - tRR.tr.x, tRR.br.y - tRR.tr.y),
      new xy(tRR.bl.x - tRR.br.x, tRR.bl.y - tRR.br.y),
      new xy(tRR.tl.x - tRR.bl.x, tRR.tl.y - tRR.bl.y),
      new xy(tRR.tr.x - tRR.tl.x, tRR.tr.y - tRR.tl.y)
  ];
  let otherTankVertices = [
      new xy(oRR.tr.x, oRR.tr.y),
      new xy(oRR.br.x, oRR.br.y),
      new xy(oRR.bl.x, oRR.bl.y),
      new xy(oRR.tl.x, oRR.tl.y),
  ];
  let otherTankEdges = [
      new xy(oRR.br.x - oRR.tr.x, oRR.br.y - oRR.tr.y),
      new xy(oRR.bl.x - oRR.br.x, oRR.bl.y - oRR.br.y),
      new xy(oRR.tl.x - oRR.bl.x, oRR.tl.y - oRR.bl.y),
      new xy(oRR.tr.x - oRR.tl.x, oRR.tr.y - oRR.tl.y)
  ];
  let thisRectPolygon = new polygon(thisTankVertices, thisTankEdges);
  let otherRectPolygon = new polygon(otherTankVertices, otherTankEdges);

  if(sat(thisRectPolygon, otherRectPolygon)){
    return true;
  }else{
      if(playerRect.rotationAngle === 0 && otherRect.rotationAngle === 0){
          if(!(
            playerRect.x>otherRect.x+otherRect.width || 
            playerRect.x+playerRect.width<otherRect.x || 
            playerRect.y>otherRect.y+otherRect.height || 
            playerRect.y+playerRect.height<otherRect.y
          )){
            return true;
          }
      }
    return false;
  }
}

function getRotatedSquareCoordinates(square){
  let centerX = square.position.x + (square.width / 2);
  let centerY = square.position.y + (square.height / 2);
  let topLeft = workOutNewPoints(centerX, centerY, square.position.x, square.position.y, square.rotationAngle);
  let topRight = workOutNewPoints(centerX, centerY, square.position.x + square.width, square.position.y, square.rotationAngle);
  let bottomLeft = workOutNewPoints(centerX, centerY, square.position.x, square.position.y + square.height, square.rotationAngle);
  let bottomRight = workOutNewPoints(centerX, centerY, square.position.x + square.width, square.position.y + square.height, square.rotationAngle);
  return{
      tl: topLeft,
      tr: topRight,
      bl: bottomLeft,
      br: bottomRight
  }
}

function workOutNewPoints(cx, cy, vx, vy, rotatedAngle){
      rotatedAngle = rotatedAngle * Math.PI / 180;
      let dx = vx - cx;
      let dy = vy - cy;
      let distance = Math.sqrt(dx * dx + dy * dy);
      let originalAngle = Math.atan2(dy,dx);
      let rotatedX = cx + distance * Math.cos(originalAngle + rotatedAngle);
      let rotatedY = cy + distance * Math.sin(originalAngle + rotatedAngle);
  
      return {
          x: rotatedX,
          y: rotatedY
      }
}

function xy(x,y){
  this.x = x;
  this.y = y;
};

function polygon(vertices, edges){
  this.vertex = vertices;
  this.edge = edges;
};

// Seperate Axis Theorum function
function sat(polygonA, polygonB){
  var perpendicularLine = null;
  var dot = 0;
  var perpendicularStack = [];
  var amin = null;
  var amax = null;
  var bmin = null;
  var bmax = null;
  //Work out all perpendicular vectors on each edge for polygonA
  for(var i = 0; i < polygonA.edge.length; i++){
       perpendicularLine = new xy(-polygonA.edge[i].y,
                                   polygonA.edge[i].x);
       perpendicularStack.push(perpendicularLine);
  }
  //Work out all perpendicular vectors on each edge for polygonB
  for(var i = 0; i < polygonB.edge.length; i++){
       perpendicularLine = new xy(-polygonB.edge[i].y,
                                   polygonB.edge[i].x);
       perpendicularStack.push(perpendicularLine);
  }
  //Loop through each perpendicular vector for both polygons
  for(var i = 0; i < perpendicularStack.length; i++){
      //These dot products will return different values each time
       amin = null;
       amax = null;
       bmin = null;
       bmax = null;
       /*Work out all of the dot products for all of the vertices in PolygonA against the perpendicular vector
       that is currently being looped through*/
       for(var j = 0; j < polygonA.vertex.length; j++){
            dot = polygonA.vertex[j].x *
                  perpendicularStack[i].x +
                  polygonA.vertex[j].y *
                  perpendicularStack[i].y;
          //Then find the dot products with the highest and lowest values from polygonA.
            if(amax === null || dot > amax){
                 amax = dot;
            }
            if(amin === null || dot < amin){
                 amin = dot;
            }
       }
       /*Work out all of the dot products for all of the vertices in PolygonB against the perpendicular vector
       that is currently being looped through*/
       for(var j = 0; j < polygonB.vertex.length; j++){
            dot = polygonB.vertex[j].x *
                  perpendicularStack[i].x +
                  polygonB.vertex[j].y *
                  perpendicularStack[i].y;
          //Then find the dot products with the highest and lowest values from polygonB.
            if(bmax === null || dot > bmax){
                 bmax = dot;
            }
            if(bmin === null || dot < bmin){
                 bmin = dot;
            }
       }
       //If there is no gap between the dot products projection then we will continue onto evaluating the next perpendicular edge.
       if((amin < bmax && amin > bmin) ||
          (bmin < amax && bmin > amin)){
            continue;
       }
       //Otherwise, we know that there is no collision for definite.
       else {
            return false;
       }
  }
  /*If we have gotten this far. Where we have looped through all of the perpendicular edges and not a single one of there projections had
  a gap in them. Then we know that the 2 polygons are colliding for definite then.*/
  return true;
}