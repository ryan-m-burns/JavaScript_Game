import { TILE_SIZE } from '../constants.js';

export default class Pickup {
  constructor(position, type = 'health') {
    this.position = position;
    this.dimensions = [TILE_SIZE / 2, TILE_SIZE / 2];
    this.type = type;
    this.value = type === 'health' ? 25 : 0;
  }

  getCollisionBox() {
    return {
      x: this.position[0],
      y: this.position[1],
      width: this.dimensions[0],
      height: this.dimensions[1]
    };
  }

  // Method to handle pickup effects
  apply(player) {
    if (this.type === 'health') {
      player.health = Math.min(
        player.health + this.value,
        player.initialHealth
      );
      return true; // Return true to indicate pickup was used
    }
    return false; // Return false if pickup couldn't be used
  }
}
