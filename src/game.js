'use strict';

import {
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
      floor: null
    };
  }

  async init() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Set canvas size
    this.canvas.width = 900;
    this.canvas.height = 600;

    // Create player
    this.player = new Player(
      [this.canvas.width / 2, this.canvas.height / 2],
      [PLAYER_SIZE, PLAYER_SIZE],
      [0, 0]
    );

    // Add some initial enemies
    this.addEnemies(3);
    this.addBoss();
    // Load sprites
    await this.loadSprites();

    // Generate initial map
    this.generateMap();

    // Setup event listeners
    this.setupEventListeners();

    // Start game loop
    this.startLoop();
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
    this.sprites.player = this.createColoredSprite('#00ff00');
    this.sprites.enemy = this.createColoredSprite('#ff0000');
    this.sprites.wall = this.createColoredSprite('#808080');
    this.sprites.floor = this.createColoredSprite('#333333');
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
    const mapWidth = Math.floor(this.canvas.width / TILE_SIZE);
    const mapHeight = Math.floor(this.canvas.height / TILE_SIZE);

    this.map = Array(mapHeight)
      .fill()
      .map(() => Array(mapWidth).fill(0));

    // Get player's tile position
    const playerTileX = Math.floor(this.player.position[0] / TILE_SIZE);
    const playerTileY = Math.floor(this.player.position[1] / TILE_SIZE);

    // Add random walls, but keep a safe zone around the player
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        // Create a safe zone around player (3x3 area)
        if (Math.abs(x - playerTileX) <= 1 || Math.abs(y - playerTileY) <= 1) {
          this.map[y][x] = 0; // Keep clear
        } else if (Math.random() < 0.2) {
          this.map[y][x] = 1; // Add wall
        }
      }
    }

    // Ensure paths are at least 2 tiles wide
    for (let y = 1; y < mapHeight - 1; y++) {
      for (let x = 1; x < mapWidth - 1; x++) {
        if (
          this.map[y][x] === 1 &&
          this.map[y][x - 1] === 1 &&
          this.map[y][x + 1] === 1
        ) {
          // If three horizontal walls in a row, remove middle one
          this.map[y][x] = 0;
        }
        if (
          this.map[y][x] === 1 &&
          this.map[y - 1][x] === 1 &&
          this.map[y + 1][x] === 1
        ) {
          // If three vertical walls in a row, remove middle one
          this.map[y][x] = 0;
        }
      }
    }
  }

  setupEventListeners() {
    // Keyboard events
    window.addEventListener('keydown', (e) => this.handleInput(e, true));
    window.addEventListener('keyup', (e) => this.handleInput(e, false));

    // Button clicks
    document
      .getElementById('toggleRunningBtn')
      .addEventListener('click', () => this.toggleRunning());
    document
      .getElementById('newGameBtn')
      .addEventListener('click', () => this.resetGame());

    // Debug mode
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
  }

  updateEnemies() {
    this.enemies.forEach((enemy) => {
      enemy.update(this.player.position, this);
    });
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

    // Draw background
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x, y, BAR_WIDTH, BAR_HEIGHT);

    // Draw health (green to red based on health percentage)
    const hue = healthPercent * 120;
    this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    this.ctx.fillRect(x, y, BAR_WIDTH * healthPercent, BAR_HEIGHT);
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
      this.drawHealthBar(
        enemy,
        enemy.position[0],
        enemy.position[1] - 8 // Position 8 pixels above enemy
      );

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
      this.player.position[1] - 8 // Position 8 pixels above player
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

    this.drawDebugInfo();
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

  resetGame() {
    // Reset game state
    this.score = 0;
    this.player.health = 100;
    this.player.position = [this.canvas.width / 2, this.canvas.height / 2];
    this.enemies = [];
    this.addEnemies(3);
    this.generateMap();
    this.pickups = [];
    this.projectiles = [];

    // Reset all input keys
    for (let key in this.keys) {
      this.keys[key] = false;
    }

    if (!this.isRunning) {
      this.startLoop();
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

  gameOver() {
    this.stopLoop();
    alert('Game Over! Score: ' + this.score);
    this.resetGame();
  }
}

// Initialize game when page loads
window.addEventListener('load', () => {
  const game = new Game();
  game.init();
});
