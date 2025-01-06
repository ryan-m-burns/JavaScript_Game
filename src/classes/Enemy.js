import {
  TILE_SIZE,
  SPRITE_SIZE,
  ENEMY_SPEED,
  BOSS_SPEED,
  PROJECTILE_TYPES,
  ENEMY_TYPES
} from '../constants.js';
import Projectile from './Projectile.js';

export default class Enemy {
  constructor(
    position = [0, 0],
    dimensions = [TILE_SIZE, TILE_SIZE],
    velocity = [0, 0],
    health = 50,
    type = 'normal',
    difficultyMod = 1.0
  ) {
    this.position = position;
    this.dimensions = dimensions;
    this.spriteSize = dimensions;
    this.collisionOffset = [
      (SPRITE_SIZE - TILE_SIZE) / 2,
      (SPRITE_SIZE - TILE_SIZE) / 2
    ];
    this.velocity = velocity;
    this.type = type;

    // Get base stats for enemy type
    const typeStats = ENEMY_TYPES[type];

    // Apply difficulty scaling
    this.health = typeStats.baseHealth * difficultyMod;
    this.initialHealth = this.health;
    this.damage = typeStats.baseDamage * difficultyMod;
    this.shootRange = typeStats.shootRange;
    this.shootChance = typeStats.shootChance;
    this.projectileSpeed = typeStats.projectileSpeed;

    // Set speed based on enemy type
    this.speed = type === 'boss' ? BOSS_SPEED : ENEMY_SPEED;
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
    if (Math.random() < this.shootChance) {
      const dx = playerPos[0] - this.position[0];
      const dy = playerPos[1] - this.position[1];
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.shootRange) {
        // Calculate normalized velocity
        const velocity = [dx / dist, dy / dist];

        // Calculate spawn position from center of enemy
        const spawnX = this.position[0] + this.dimensions[0] / 2;
        const spawnY = this.position[1] + this.dimensions[1] / 2;

        // Create projectile with correct type and speed
        gameState.projectiles.push(
          new Projectile(
            [spawnX, spawnY], // Centered position
            velocity,
            true, // isEnemy
            null, // Let size be determined by type
            this.damage, // Pass damage
            this.projectileSpeed *
              PROJECTILE_TYPES[this.type === 'boss' ? 'boss' : 'enemy']
                .baseSpeed, // Adjust speed
            this.type === 'boss' ? 'boss' : 'enemy' // Specify correct type
          )
        );
      }
    }
  }

  update(playerPos, gameState) {
    // Calculate distance to player
    const dx = playerPos[0] - this.position[0];
    const dy = playerPos[1] - this.position[1];
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Boss-specific behavior
    if (this.type === 'boss') {
      this.updateBoss(playerPos, gameState, dx, dy, dist);
    } else {
      this.updateNormal(dx, dy, dist);
    }

    // Update position
    this.position[0] += this.velocity[0];
    this.position[1] += this.velocity[1];

    // Update direction based on movement
    if (Math.abs(this.velocity[0]) > Math.abs(this.velocity[1])) {
      this.direction = this.velocity[0] > 0 ? 'right' : 'left';
    } else {
      this.direction = this.velocity[1] > 0 ? 'down' : 'up';
    }

    // Handle shooting
    this.shoot(playerPos, gameState);
  }

  updateNormal(dx, dy, dist) {
    if (dist > 0) {
      this.velocity[0] = (dx / dist) * this.speed;
      this.velocity[1] = (dy / dist) * this.speed;
    }
  }

  updateBoss(playerPos, gameState, dx, dy, dist) {
    // Boss specific movement pattern
    if (dist > 0) {
      // Bosses move more erratically
      const angle = Math.atan2(dy, dx) + Math.sin(Date.now() / 1000) * 0.5;
      this.velocity[0] = Math.cos(angle) * this.speed;
      this.velocity[1] = Math.sin(angle) * this.speed;
    }
  }
}
