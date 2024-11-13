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

  // toggle game state
  toggleRunning() {
    if (!this.isRunning) {
      game.startLoop(this.loopDuration);
    } else {
      game.stopLoop();
    }
  },
  // create event listeners for game
  setupEventListeners() {
    $('#toggleRunningBtn').on('click', game.toggleRunning);

    window.addEventListener('keydown', (e) => {
      this.handleInput(e, true);
    });

    window.addEventListener('keyup', (e) => {
      this.handleInput(e, false);
    });
  },

  handleInput(e, isKeyDown) {
    switch (e.key) {
      case 'ArrowLeft':
        // Handle left movement
        break;
      case 'ArrowRight':
        // Handle right movement
        break;
      case 'ArrowUp':
        // Handle up movement
        break;
      case 'ArrowDown':
        // Handle down movement
        break;
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
      this.draw();
      this.checkForCollisions();
    }
    requestAnimationFrame(this.animate);
  },

  draw() {},

  checkForCollisions() {}
};
