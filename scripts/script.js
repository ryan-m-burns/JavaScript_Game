'use strict';

const game = {
  canvas: null,
  ctx: null,
  isRunning: false,
  players: [],
  enemies: [],
  traps: [],
  map: [],
  loopDuration: 1000 / 60,
  lastKeyFrame: null,

  toggleRunning() {
    if (!this.isRunning) {
      game.startLoop(this.loopDuration);
    } else {
      game.stopLoop();
    }
  },

  startLoop(duration) {
    if (duration > 0) {
      this.loopDuration = duration;
    }
    this.isRunning = true;
    window.requestAnimationFrame(this.animationFrameFunction);
  },

  stopLoop() {
    this.isRunning = false;
    this.lastKeyFrame = null;
  },

  animate(timestamp) {
    if (!this.isRunning) return;

    if (this.lastKeyFrame === null) this.lastKeyFrame = timestamp;

    if (timestamp - this.loopDuration > this.lastKeyFrame) {
      const deltaTime = timestamp - this.lastKeyFrame;
      this.lastKeyFrame = timestamp;
      // redraw everything in canvas
      // check for collisions
    }
    requestAnimationFrame(this.animate);
  }
};
