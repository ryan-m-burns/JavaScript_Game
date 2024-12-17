import { TILE_SIZE, SPRITE_SIZE, ENEMY_SPEED } from '../constants.js';
import Projectile from './Projectile.js';

export default class Enemy {
  constructor(
    position = [0, 0],
    dimensions = [TILE_SIZE, TILE_SIZE],
    velocity = [0, 0],
    health = 50,
    classes = 'enemy'
  ) {
    this.position = position;
    this.dimensions = dimensions;
    this.spriteSize = dimensions;
    this.collisionOffset = [
      (SPRITE_SIZE - TILE_SIZE) / 2,
      (SPRITE_SIZE - TILE_SIZE) / 2
    ];
    this.velocity = velocity;
    this.classes = classes;
    this.health = health;
    this.initialHealth = this.health;
    this.damage = 10;
    this.direction = 'down';
  }

  getCollisionBox() {
    return {
      x: this.position[0] + this.collisionOffset[0],
      y: this.position[1] + this.collisionOffset[1],
      width: this.dimensions[0],
      height: this.dimensions[1]
    };
  }

  shoot(playerPos, gameState) {
    if (Math.random() < 0.01) {
      // 1% chance to shoot each frame
      const dx = playerPos[0] - this.position[0];
      const dy = playerPos[1] - this.position[1];
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 300) {
        // Only shoot if player is within range
        const velocity = [dx / dist, dy / dist];
        gameState.projectiles.push(
          new Projectile([this.position[0], this.position[1]], velocity, true)
        );
      }
    }
  }

  update(playerPos, gameState) {
    // Basic AI: Move towards player
    const dx = playerPos[0] - this.position[0];
    const dy = playerPos[1] - this.position[1];
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      this.velocity[0] = (dx / dist) * ENEMY_SPEED;
      this.velocity[1] = (dy / dist) * ENEMY_SPEED;
    }

    this.position[0] += this.velocity[0];
    this.position[1] += this.velocity[1];

    // Update direction based on movement
    if (Math.abs(this.velocity[0]) > Math.abs(this.velocity[1])) {
      this.direction = this.velocity[0] > 0 ? 'right' : 'left';
    } else {
      this.direction = this.velocity[1] > 0 ? 'down' : 'up';
    }

    this.shoot(playerPos, gameState);
  }
}
