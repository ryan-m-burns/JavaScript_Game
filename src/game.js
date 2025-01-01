'use strict';

import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  TILE_SIZE,
  SPRITE_SIZE,
  ENEMY_SIZE,
  BOSS_SIZE,
  PLAYER_SIZE,
  BOSS_SPEED,
  PLAYER_SPEED,
  ENEMY_SPEED,
  ATTACK_DMG,
  FRAME_DURATION,
  GAME_STATES
} from './constants.js';

import Door from './classes/Door.js';
import Player from './classes/Player.js';
import Enemy from './classes/Enemy.js';
import Pickup from './classes/Pickup.js';
import Projectile from './classes/Projectile.js';

class Game {
  constructor() {
    this.canvas = null;
    this.debugMode = false;
    this.ctx = null;
    this.score = 0;
    this.isRunning = false;
    this.player = null;
    this.enemies = [];
    this.map = [];
    this.pickups = [];
    this.projectiles = [];
    this.loopDuration = FRAME_DURATION;
    this.lastKeyFrame = null;
    this.currentFloor = 1;
    this.door = null;
    this.currentScreen = 'splashScreen';
    this.screens = [
      'splashScreen',
      'gameScreen',
      'gameOverScreen',
      'pauseScreen'
    ];
    this.isPaused = false;
    this.keys = {
      ArrowLeft: false,
      ArrowRight: false,
      ArrowUp: false,
      ArrowDown: false,
      Space: false
    };
    this.sprites = {
      player: null,
      enemy: null,
      wall: null,
      floor: null,
      door: null
    };
  }

  async init() {
    // Create and setup canvas
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'gameCanvas';
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;

    // Add canvas to game area
    const gameArea = document.getElementById('gameArea');
    if (!gameArea) {
      console.error('Game area element not found');
      return;
    }
    gameArea.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');

    // Initialize game components
    this.player = new Player(
      [this.canvas.width / 2, this.canvas.height / 2],
      [PLAYER_SIZE, PLAYER_SIZE],
      [0, 0]
    );

    await this.loadSprites();

    // Wait for DOM to be fully loaded before setting up event listeners
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () =>
        this.setupEventListeners()
      );
    } else {
      this.setupEventListeners();
    }

    this.showScreen('splashScreen');
  }

  drawDebugInfo() {
    if (!this.debugMode) return;

    // Draw player collision box
    const playerBox = this.player.getCollisionBox();
    this.ctx.strokeStyle = 'blue';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      playerBox.x,
      playerBox.y,
      playerBox.width,
      playerBox.height
    );

    // Draw enemy collision boxes
    this.enemies.forEach((enemy) => {
      const enemyBox = enemy.getCollisionBox();
      this.ctx.strokeStyle = 'yellow';
      this.ctx.strokeRect(
        enemyBox.x,
        enemyBox.y,
        enemyBox.width,
        enemyBox.height
      );
    });

    // Draw pickup collision boxes
    this.pickups.forEach((pickup) => {
      const pickupBox = pickup.getCollisionBox();
      this.ctx.strokeStyle = 'green';
      this.ctx.strokeRect(
        pickupBox.x,
        pickupBox.y,
        pickupBox.width,
        pickupBox.height
      );
    });

    // Draw projectile collision boxes
    this.projectiles.forEach((projectile) => {
      const projBox = projectile.getCollisionBox();
      this.ctx.strokeStyle = 'orange';
      this.ctx.strokeRect(projBox.x, projBox.y, projBox.width, projBox.height);
    });
  }

  addEnemies(count) {
    for (let i = 0; i < count; i++) {
      const x = Math.random() * (this.canvas.width - TILE_SIZE);
      const y = Math.random() * (this.canvas.height - TILE_SIZE);
      this.enemies.push(new Enemy([x, y], [ENEMY_SIZE, ENEMY_SIZE])); // Specify size
    }
  }

  addBoss() {
    const x = Math.random() * (this.canvas.width - TILE_SIZE);
    const y = Math.random() * (this.canvas.height - TILE_SIZE);
    this.enemies.push(
      new Enemy([x, y], [BOSS_SIZE, BOSS_SIZE], [0, 0], 100, 'boss')
    );
  }

  async loadSprites() {
    // Create colored rectangles for now - you can replace with actual sprite images
    this.sprites.player = this.createColoredSprite('#000000');
    this.sprites.enemy = this.createColoredSprite('#ff0000');
    this.sprites.wall = this.createColoredSprite('#808080');
    this.sprites.floor = this.createColoredSprite('#333333');
    this.sprites.door = this.createColoredSprite('#ffd700');
  }

  createColoredSprite(color) {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    return canvas;
  }

  generateMap() {
    // First calculate dimensions
    const mapWidth = Math.floor(this.canvas.width / TILE_SIZE);
    const mapHeight = Math.floor(this.canvas.height / TILE_SIZE);

    // Safety check for canvas dimensions
    if (!this.canvas || mapWidth <= 0 || mapHeight <= 0) {
      console.error('Invalid canvas dimensions for map generation');
      return;
    }

    // Initialize the map array with the correct dimensions first
    this.map = Array(mapHeight)
      .fill()
      .map(() => Array(mapWidth).fill(0));

    // Get player's tile position (if player exists)
    if (this.player) {
      const playerTileX = Math.floor(this.player.position[0] / TILE_SIZE);
      const playerTileY = Math.floor(this.player.position[1] / TILE_SIZE);

      // Ensure player position is within bounds
      const safePlayerTileX = Math.min(Math.max(playerTileX, 1), mapWidth - 2);
      const safePlayerTileY = Math.min(Math.max(playerTileY, 1), mapHeight - 2);

      // Add random walls, but keep a safe zone around the player
      for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
          // Create a safe zone around player (3x3 area)
          if (
            Math.abs(x - safePlayerTileX) <= 1 ||
            Math.abs(y - safePlayerTileY) <= 1
          ) {
            this.map[y][x] = 0; // Keep clear
          } else if (Math.random() < 0.2) {
            this.map[y][x] = 1; // Add wall
          }
        }
      }

      // Ensure paths are at least 2 tiles wide (with bounds checking)
      for (let y = 1; y < mapHeight - 1; y++) {
        for (let x = 1; x < mapWidth - 1; x++) {
          // Add bounds checking for all array accesses
          if (
            x >= 2 &&
            x < mapWidth - 2 && // Ensure we have room to check neighbors
            this.map[y][x] === 1 &&
            this.map[y][x - 1] === 1 &&
            this.map[y][x + 1] === 1 &&
            this.map[y][x - 2] === 1 &&
            this.map[y][x + 2] === 1
          ) {
            // If three horizontal walls in a row, remove middle one
            this.map[y][x] = 0;
          }
          if (
            y >= 2 &&
            y < mapHeight - 2 && // Ensure we have room to check neighbors
            this.map[y][x] === 1 &&
            this.map[y - 1] &&
            this.map[y - 1][x] === 1 &&
            this.map[y + 1] &&
            this.map[y + 1][x] === 1 &&
            this.map[y - 2] &&
            this.map[y - 2][x] === 1 &&
            this.map[y + 2] &&
            this.map[y + 2][x] === 1
          ) {
            // If three vertical walls in a row, remove middle one
            this.map[y][x] = 0;
          }
        }
      }
    } else {
      // If no player exists, just create an empty map
      for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
          this.map[y][x] = 0;
        }
      }
    }

    // Verify map integrity
    if (!this.verifyMap()) {
      console.error('Map verification failed, creating empty map');
      this.map = Array(mapHeight)
        .fill()
        .map(() => Array(mapWidth).fill(0));
    }
  }

  verifyMap() {
    if (!Array.isArray(this.map)) return false;

    const height = this.map.length;
    if (height === 0) return false;

    const width = this.map[0].length;
    if (width === 0) return false;

    // Check that all rows exist and have the correct width
    return this.map.every(
      (row) =>
        Array.isArray(row) &&
        row.length === width &&
        row.every((cell) => cell === 0 || cell === 1)
    );
  }

  setupEventListeners() {
    // Keyboard event listeners
    window.addEventListener('keydown', (e) => this.handleInput(e, true));
    window.addEventListener('keyup', (e) => this.handleInput(e, false));

    // UI button listeners
    const buttons = {
      toggleRunningBtn: () => this.togglePause(),
      newGameBtn: () => this.resetGame(),
      gameInfoBtn: () => this.showGameInstructions(),
      startGameButton: () => this.startNewGame(),
      playAgainButton: () => this.resetGame(),
      quitButtonGameOver: () => this.quitGame(),
      resumeButton: () => this.resumeGame(),
      resetButtonPause: () => this.resetGame()
    };

    // Add event listeners with proper binding
    Object.entries(buttons).forEach(([id, handler]) => {
      const element = document.getElementById(id);
      if (element) {
        // Bind the handler to maintain correct 'this' context
        element.addEventListener('click', handler.bind(this));
      } else {
        console.warn(`Button element ${id} not found`);
      }
    });

    // Debug mode toggle
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyD') {
        this.debugMode = !this.debugMode;
      }
    });
  }

  handleInput(e, isKeyDown) {
    if (this.keys.hasOwnProperty(e.code)) {
      this.keys[e.code] = isKeyDown;

      // Update player direction based on last pressed key
      if (isKeyDown) {
        switch (e.code) {
          case 'ArrowLeft':
            this.player.direction = 'left';
            break;
          case 'ArrowRight':
            this.player.direction = 'right';
            break;
          case 'ArrowUp':
            this.player.direction = 'up';
            break;
          case 'ArrowDown':
            this.player.direction = 'down';
            break;
          case 'Space':
            this.player.attack(this);
            break;
        }
      }
      e.preventDefault();
    }
  }

  updatePlayer() {
    // Calculate new velocity based on input
    let dx = 0;
    let dy = 0;

    if (this.keys.ArrowLeft) dx -= PLAYER_SPEED;
    if (this.keys.ArrowRight) dx += PLAYER_SPEED;
    if (this.keys.ArrowUp) dy -= PLAYER_SPEED;
    if (this.keys.ArrowDown) dy += PLAYER_SPEED;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707; // 1/√2
      dy *= 0.707;
    }

    // Update player position
    const newX = this.player.position[0] + dx;
    const newY = this.player.position[1] + dy;

    // Check collision with walls
    if (!this.checkWallCollision(newX, newY)) {
      this.player.position[0] = newX;
      this.player.position[1] = newY;
    }

    // Check collision with enemies
    this.enemies.forEach((enemy) => {
      if (this.checkEntityCollision(this.player, enemy)) {
        this.player.health = Math.max(0, this.player.health - 1);
        if (this.player.health <= 0) {
          this.gameOver();
        }
      }
    });

    // Update player state
    this.player.update();

    if (this.door && this.checkEntityCollision(this.player, this.door)) {
      this.nextFloor();
    }
  }

  updateEnemies() {
    try {
      this.enemies.forEach((enemy) => {
        enemy.update(this.player.position, this);
      });

      // Check if floor is cleared after enemy updates
      if (this.isRunning) {
        // Only check if game is running
        this.checkFloorCleared();
      }
    } catch (error) {
      console.error('Error in updateEnemies:', error);
    }
  }

  spawnHealthPickup() {
    if (Math.random() < 0.005 && this.pickups.length < 3) {
      // 0.5% chance each frame, max 3 pickups
      let x, y;
      do {
        x = Math.random() * (this.canvas.width - TILE_SIZE);
        y = Math.random() * (this.canvas.height - TILE_SIZE);
      } while (this.checkWallCollision(x, y));

      this.pickups.push(new Pickup([x, y], 'health'));
    }
  }

  checkPickups() {
    this.pickups = this.pickups.filter((pickup) => {
      if (this.checkEntityCollision(this.player, pickup)) {
        return !pickup.apply(this.player); // Remove if successfully applied
      }
      return true;
    });
  }

  updateProjectiles() {
    this.projectiles = this.projectiles.filter((projectile) => {
      projectile.update();

      if (!projectile.isInBounds(this.canvas.width, this.canvas.height)) {
        return false;
      }

      // Check wall collisions
      if (
        this.checkWallCollision(projectile.position[0], projectile.position[1])
      ) {
        return false;
      }

      // Check if projectile is off screen
      if (
        projectile.position[0] < 0 ||
        projectile.position[0] > this.canvas.width ||
        projectile.position[1] < 0 ||
        projectile.position[1] > this.canvas.height
      ) {
        return false;
      }

      // Check hits
      if (projectile.isEnemy) {
        if (this.checkEntityCollision(projectile, this.player)) {
          this.player.health -= projectile.damage;
          if (this.player.health <= 0) {
            this.gameOver();
          }
          return false;
        }
      }

      return true;
    });
  }

  checkWallCollision(x, y, width = SPRITE_SIZE, height = SPRITE_SIZE) {
    // Check all four corners
    const corners = [
      [x, y], // Top-left
      [x + width, y], // Top-right
      [x, y + height], // Bottom-left
      [x + width, y + height] // Bottom-right
    ];

    for (const [cornerX, cornerY] of corners) {
      const tileX = Math.floor(cornerX / TILE_SIZE);
      const tileY = Math.floor(cornerY / TILE_SIZE);

      if (
        tileX < 0 ||
        tileY < 0 ||
        tileX >= this.map[0].length ||
        tileY >= this.map.length ||
        this.map[tileY][tileX] === 1
      ) {
        return true; // Collision detected
      }
    }
    return false;
  }

  drawHealthBar(entity, x, y) {
    const BAR_HEIGHT = 4;
    const BAR_WIDTH = entity.dimensions[0];
    const healthPercent = entity.health / entity.initialHealth;

    // Calculate position - now using the entire height of the sprite
    const barY = y + entity.spriteSize[1] - BAR_HEIGHT; // Use spriteSize for full height

    // Draw background
    this.ctx.fillStyle = '#555';
    this.ctx.fillRect(x, barY, BAR_WIDTH, BAR_HEIGHT);

    // Draw health (green to red based on health percentage)
    const hue = healthPercent * 120;
    this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    this.ctx.fillRect(x, barY, BAR_WIDTH * healthPercent, BAR_HEIGHT);
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw map
    for (let y = 0; y < this.map.length; y++) {
      for (let x = 0; x < this.map[y].length; x++) {
        const sprite =
          this.map[y][x] === 1 ? this.sprites.wall : this.sprites.floor;
        this.ctx.drawImage(sprite, x * TILE_SIZE, y * TILE_SIZE);
      }
    }

    // Draw enemies and their health bars
    this.enemies.forEach((enemy) => {
      // Draw enemy sprite
      this.ctx.drawImage(
        this.sprites.enemy,
        enemy.position[0],
        enemy.position[1],
        enemy.spriteSize[0],
        enemy.spriteSize[1]
      );

      // Draw health bar above enemy
      this.drawHealthBar(enemy, enemy.position[0], enemy.position[1]);

      // Debug: Draw collision box
      if (this.debugMode) {
        const box = enemy.getCollisionBox();
        this.ctx.strokeStyle = 'yellow';
        this.ctx.strokeRect(box.x, box.y, box.width, box.height);
      }
    });

    // Draw player
    this.ctx.drawImage(
      this.sprites.player,
      this.player.position[0],
      this.player.position[1],
      this.player.spriteSize[0],
      this.player.spriteSize[1]
    );

    // Draw player health bar
    this.drawHealthBar(
      this.player,
      this.player.position[0],
      this.player.position[1]
    );

    // Debug: Draw player collision box
    if (this.debugMode) {
      const box = this.player.getCollisionBox();
      this.ctx.strokeStyle = 'blue';
      this.ctx.strokeRect(box.x, box.y, box.width, box.height);
    }

    // Draw attack hitbox when attacking
    if (this.player.attackCooldown > 15) {
      // Only show for first few frames of attack
      const hitbox = this.player.getAttackHitbox();
      this.ctx.strokeStyle = '#ff0';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);

      // Fill with semi-transparent yellow
      this.ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
      this.ctx.fillRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
    }

    // Draw UI
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '20px Arial';
    this.ctx.fillText(`Health: ${this.player.health}`, 10, 30);
    this.ctx.fillText(`Score: ${this.score}`, 10, 60);

    // Draw attack cooldown
    if (this.player.attackCooldown > 0) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.fillRect(10, 70, (this.player.attackCooldown / 20) * 100, 10);
    }

    // Draw pickups
    this.pickups.forEach((pickup) => {
      this.ctx.fillStyle = pickup.type === 'health' ? '#ff0000' : '#ffffff';
      this.ctx.fillRect(
        pickup.position[0],
        pickup.position[1],
        pickup.dimensions[0],
        pickup.dimensions[1]
      );
    });

    // Draw projectiles
    this.projectiles.forEach((projectile) => {
      this.ctx.fillStyle = projectile.isEnemy ? '#ff0000' : '#00ff00';
      this.ctx.fillRect(
        projectile.position[0],
        projectile.position[1],
        projectile.dimensions[0],
        projectile.dimensions[1]
      );
    });

    // Draw door if it exists
    if (this.door) {
      this.ctx.drawImage(
        this.sprites.door,
        this.door.position[0],
        this.door.position[1],
        this.door.dimensions[0],
        this.door.dimensions[1]
      );
    }

    // Draw floor number
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '20px Arial';
    this.ctx.fillText(`Floor: ${this.currentFloor}`, 10, 90);

    // Debug: Draw door collision box
    if (this.debugMode && this.door) {
      const doorBox = this.door.getCollisionBox();
      this.ctx.strokeStyle = 'gold';
      this.ctx.strokeRect(doorBox.x, doorBox.y, doorBox.width, doorBox.height);
    }

    this.drawDebugInfo();
  }

  nextFloor() {
    this.currentFloor++;
    this.score += 1000; // Bonus points for completing floor
    this.door = null;

    // Heal player slightly between floors
    this.player.health = Math.min(
      this.player.health + 20,
      this.player.initialHealth
    );

    // Reset player position
    this.player.position = [this.canvas.width / 2, this.canvas.height / 2];

    // Clear existing enemies and projectiles
    this.enemies = [];
    this.projectiles = [];

    // Generate new floor
    this.generateMap();

    // Add enemies (increasing with floor number)
    const numEnemies = 3 + Math.floor(this.currentFloor / 2);
    this.addEnemies(numEnemies);

    // Add boss every 5 floors
    if (this.currentFloor % 5 === 0) {
      this.addBoss();
    }
  }

  animate(timestamp) {
    if (!this.isRunning) return;

    if (this.lastKeyFrame === null) {
      this.lastKeyFrame = timestamp;
    }

    const deltaTime = timestamp - this.lastKeyFrame;

    if (deltaTime >= this.loopDuration) {
      this.lastKeyFrame = timestamp;
      this.updatePlayer();
      this.updateEnemies();
      this.spawnHealthPickup();
      this.checkPickups();
      this.updateProjectiles();
      this.draw();
    }

    requestAnimationFrame((ts) => this.animate(ts));
  }

  startLoop() {
    this.isRunning = true;
    requestAnimationFrame((ts) => this.animate(ts));
  }

  stopLoop() {
    this.isRunning = false;
    this.lastKeyFrame = null;
  }

  toggleRunning() {
    if (this.isRunning) {
      this.stopLoop();
    } else {
      this.startLoop();
    }
  }

  togglePause() {
    if (this.currentScreen !== 'gameScreen') return;

    if (!this.isPaused) {
      this.pauseGame();
    } else {
      this.resumeGame();
    }
  }

  pauseGame() {
    this.isPaused = true;
    this.stopLoop();
    document.getElementById('pauseScreen').style.display = 'block';
  }

  resumeGame() {
    this.isPaused = false;
    document.getElementById('pauseScreen').style.display = 'none';
    this.startLoop();
  }

  resetGame() {
    if (this.isPaused) {
      document.getElementById('pauseScreen').style.display = 'none';
      this.isPaused = false;
    }

    // Ensure canvas is properly initialized
    if (!this.canvas || !this.ctx) {
      console.error('Canvas not initialized');
      return;
    }

    // Reset game state
    this.score = 0;

    // Reset player position and health
    if (!this.player) {
      this.player = new Player(
        [this.canvas.width / 2, this.canvas.height / 2],
        [PLAYER_SIZE, PLAYER_SIZE],
        [0, 0]
      );
    } else {
      this.player.health = 100;
      this.player.position = [this.canvas.width / 2, this.canvas.height / 2];
    }

    // Clear and reset game elements
    this.enemies = [];
    this.pickups = [];
    this.projectiles = [];
    this.currentFloor = 1;
    this.door = null;

    try {
      // Generate new map with error handling
      this.generateMap();

      // Add enemies only if map generation was successful
      if (this.map && this.map.length > 0) {
        this.addEnemies(3);
      } else {
        console.error('Map generation failed');
        return;
      }
    } catch (error) {
      console.error('Error during game reset:', error);
      return;
    }

    // Reset all input keys
    Object.keys(this.keys).forEach((key) => {
      this.keys[key] = false;
    });

    // Make sure we're showing the game screen
    this.showScreen('gameScreen');

    // Ensure the game loop is running
    if (!this.isRunning) {
      this.startLoop();
    }
  }

  checkFloorCleared() {
    if (this.enemies.length === 0 && !this.door) {
      this.spawnDoor();
    }
  }

  spawnDoor() {
    try {
      const ATTEMPTS = 100; // Maximum attempts to find valid position
      let x, y;
      let attempts = 0;

      do {
        // Calculate position in tile coordinates first
        const tileX = Math.floor(Math.random() * (this.map[0].length - 2)) + 1;
        const tileY = Math.floor(Math.random() * (this.map.length - 2)) + 1;

        // Convert to pixel coordinates
        x = tileX * TILE_SIZE;
        y = tileY * TILE_SIZE;

        attempts++;

        // Check if this position is valid (not colliding with walls)
        if (
          !this.checkWallCollision(x, y, TILE_SIZE, TILE_SIZE) &&
          // Ensure not too close to player
          Math.hypot(x - this.player.position[0], y - this.player.position[1]) >
            TILE_SIZE * 3
        ) {
          this.door = new Door([x, y]);
          return; // Valid position found
        }
      } while (attempts < ATTEMPTS);

      // If no valid position found after max attempts, place door in center of room
      const centerX = Math.floor(this.map[0].length / 2) * TILE_SIZE;
      const centerY = Math.floor(this.map.length / 2) * TILE_SIZE;
      this.door = new Door([centerX, centerY]);
    } catch (error) {
      console.error('Error spawning door:', error);
      // Fallback: place door in a safe default position
      this.door = new Door([TILE_SIZE, TILE_SIZE]);
    }
  }

  checkEntityCollision(entity1, entity2) {
    let box1, box2;

    // Get collision boxes for both entities
    if (entity1.getCollisionBox) {
      box1 = entity1.getCollisionBox();
    } else {
      box1 = {
        x: entity1.position[0],
        y: entity1.position[1],
        width: entity1.dimensions[0],
        height: entity1.dimensions[1]
      };
    }

    if (entity2.getCollisionBox) {
      box2 = entity2.getCollisionBox();
    } else {
      box2 = {
        x: entity2.position[0],
        y: entity2.position[1],
        width: entity2.dimensions[0],
        height: entity2.dimensions[1]
      };
    }

    // AABB Collision check
    const collision =
      box1.x < box2.x + box2.width &&
      box1.x + box1.width > box2.x &&
      box1.y < box2.y + box2.height &&
      box1.y + box1.height > box2.y;

    // Debug visualization if debug mode is on
    if (this.debugMode && collision) {
      this.ctx.strokeStyle = 'red';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(box1.x, box1.y, box1.width, box1.height);
      this.ctx.strokeRect(box2.x, box2.y, box2.width, box2.height);
    }

    return collision;
  }

  showScreen(screenName) {
    // Hide all screens
    this.screens.forEach((screen) => {
      const element = document.getElementById(screen);
      if (element) {
        element.style.display = 'none';
      }
    });

    // Show requested screen
    const newScreen = document.getElementById(screenName);
    if (newScreen) {
      newScreen.style.display = 'block';
    }
    this.currentScreen = screenName;
  }

  startNewGame() {
    this.resetGame();
    this.showScreen('gameScreen');
    this.generateMap();
    this.startLoop();
  }

  quitGame() {
    this.stopLoop();
    this.showScreen('splashScreen');
  }

  showGameInstructions() {
    const gameplayModal = new bootstrap.Modal(
      document.getElementById('gameplayModal')
    );
    gameplayModal.show();
  }

  gameOver() {
    this.stopLoop();
    this.showScreen('gameOverScreen');

    // Update score display
    const scoreElement = document.getElementById('scoreWrapper');
    if (scoreElement) {
      scoreElement.textContent = `Final Score: ${this.score}`;
    }
  }
}

// Initialize game when page loads
window.addEventListener('load', () => {
  const game = new Game();
  game.init();
});
