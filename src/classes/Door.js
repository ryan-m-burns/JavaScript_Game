import { TILE_SIZE } from '../constants.js';

class Door {
  constructor(position) {
    this.position = position;
    this.dimensions = [TILE_SIZE, TILE_SIZE];
  }

  getCollisionBox() {
    return {
      x: this.position[0],
      y: this.position[1],
      width: this.dimensions[0],
      height: this.dimensions[1]
    };
  }
}

export default Door;
