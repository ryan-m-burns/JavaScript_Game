import { TILE_SIZE } from '../constants.js';

export default class Projectile {
  constructor(position, velocity, isEnemy = true) {
    this.position = [...position];
    this.velocity = velocity;
    this.dimensions = [TILE_SIZE / 4, TILE_SIZE / 4];
    this.speed = 5;
    this.isEnemy = isEnemy;
    this.damage = isEnemy ? 10 : 25;
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
    this.position[0] += this.velocity[0] * this.speed;
    this.position[1] += this.velocity[1] * this.speed;
  }

  // Check if projectile is within bounds
  isInBounds(canvasWidth, canvasHeight) {
    return (
      this.position[0] >= 0 &&
      this.position[0] <= canvasWidth &&
      this.position[1] >= 0 &&
      this.position[1] <= canvasHeight
    );
  }
}
