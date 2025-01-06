import { TILE_SIZE, PROJECTILE_TYPES } from '../constants.js';

export default class Projectile {
  constructor(
    position,
    velocity,
    isEnemy = true,
    size = null,
    damage = null,
    speed = null,
    type = null
  ) {
    this.position = [...position];
    this.velocity = velocity;
    this.isEnemy = isEnemy;

    // Determine projectile type
    if (!type) {
      type = isEnemy ? 'enemy' : 'player';
    }
    this.type = type;

    // Get base stats from type
    const typeStats = PROJECTILE_TYPES[this.type];

    // Set size (allow override but ensure minimum size)
    const baseSize = typeStats.baseSize;
    this.dimensions = [
      size ? Math.max(size, baseSize / 2) : baseSize,
      size ? Math.max(size, baseSize / 2) : baseSize
    ];

    // Set damage (allow override)
    this.damage = damage || typeStats.baseDamage;

    // Set speed (allow override)
    this.speed = speed || typeStats.baseSpeed;

    // Set color
    this.color = typeStats.color;

    // Add properties for special effects
    this.age = 0;
    this.maxAge = 300; // 5 seconds at 60fps
    this.hasHit = false;
  }

  getCollisionBox() {
    return {
      x: this.position[0],
      y: this.position[1],
      width: this.dimensions[0],
      height: this.dimensions[1]
    };
  }

  update() {
    // Update position
    this.position[0] += this.velocity[0] * this.speed;
    this.position[1] += this.velocity[1] * this.speed;

    // Update age
    this.age++;

    // Add special effects based on type
    if (this.type === 'boss') {
      // Boss projectiles can have pulsing size
      const pulseFactor = 1 + Math.sin(this.age * 0.1) * 0.2;
      this.dimensions = [
        PROJECTILE_TYPES.boss.baseSize * pulseFactor,
        PROJECTILE_TYPES.boss.baseSize * pulseFactor
      ];
    }
  }

  isInBounds(canvasWidth, canvasHeight) {
    return (
      this.position[0] >= 0 &&
      this.position[0] <= canvasWidth &&
      this.position[1] >= 0 &&
      this.position[1] <= canvasHeight &&
      this.age < this.maxAge
    );
  }

  // Helper method to get projectile's current state
  getDrawInfo() {
    return {
      position: this.position,
      dimensions: this.dimensions,
      color: this.color,
      type: this.type,
      age: this.age
    };
  }
}
