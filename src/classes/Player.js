import {
  TILE_SIZE,
  SPRITE_SIZE,
  PLAYER_SIZE,
  PLAYER_SPEED,
  ATTACK_DMG
} from '../constants.js';

export default class Player {
  constructor(
    position = [0, 0],
    dimensions = [PLAYER_SIZE, PLAYER_SIZE],
    velocity = [0, 0],
    health = 100,
    classes = 'player'
  ) {
    this.position = position;
    this.dimensions = dimensions;
    this.spriteSize = [SPRITE_SIZE, SPRITE_SIZE];
    this.collisionOffset = [
      (SPRITE_SIZE - PLAYER_SIZE) / 2,
      (SPRITE_SIZE - PLAYER_SIZE) / 2
    ];
    this.velocity = velocity;
    this.classes = classes;
    this.health = health;
    this.initialHealth = this.health;
    this.score = 0;
    this.direction = 'down';
    this.isMoving = false;
    this.attackCooldown = 0;
  }

  attack(gameState) {
    if (this.attackCooldown <= 0) {
      const attackBox = this.getAttackHitbox();
      const hitboxEntity = {
        getCollisionBox() {
          return attackBox;
        }
      };

      gameState.enemies = gameState.enemies.filter((enemy) => {
        if (gameState.checkEntityCollision(hitboxEntity, enemy)) {
          enemy.health -= ATTACK_DMG;
          if (enemy.health <= 0) {
            gameState.score += 100;
            return false;
          }
        }
        return true;
      });

      this.attackCooldown = 20;
    }
  }

  getCollisionBox() {
    return {
      x: this.position[0] + this.collisionOffset[0],
      y: this.position[1] + this.collisionOffset[1],
      width: this.dimensions[0],
      height: this.dimensions[1]
    };
  }

  getAttackHitbox() {
    const hitboxSize = TILE_SIZE;
    // Start from player's center
    let x = this.position[0] + this.dimensions[0] / 2;
    let y = this.position[1] + this.dimensions[1] / 2;

    // Position hitbox based on player direction
    switch (this.direction) {
      case 'up':
        x -= hitboxSize / 2; // Center horizontally
        y -= hitboxSize + this.dimensions[1] / 2; // Place above player
        break;
      case 'down':
        x -= hitboxSize / 2; // Center horizontally
        y += this.dimensions[1] / 2; // Place below player
        break;
      case 'left':
        x -= hitboxSize + this.dimensions[0] / 2; // Place left of player
        y -= hitboxSize / 2; // Center vertically
        break;
      case 'right':
        x += this.dimensions[0] / 2; // Place right of player
        y -= hitboxSize / 2; // Center vertically
        break;
    }

    return {
      x,
      y,
      width: hitboxSize,
      height: hitboxSize
    };
  }

  checkAttackCollision(hitbox, enemy) {
    return (
      hitbox.x < enemy.position[0] + enemy.dimensions[0] &&
      hitbox.x + hitbox.width > enemy.position[0] &&
      hitbox.y < enemy.position[1] + enemy.dimensions[1] &&
      hitbox.y + hitbox.height > enemy.position[1]
    );
  }

  move(dx, dy) {
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707; // 1/√2 for diagonal movement normalization
      dy *= 0.707;
    }

    this.position[0] += dx * PLAYER_SPEED;
    this.position[1] += dy * PLAYER_SPEED;
  }

  update() {
    this.attackCooldown = Math.max(0, this.attackCooldown - 1);
  }
}
