// Game dimensions
export const TILE_SIZE = 30;
export const SPRITE_SIZE = 24;
export const ENEMY_SIZE = 24;
export const BOSS_SIZE = 48;
export const PLAYER_SIZE = 24;

// Game mechanics
export const BOSS_SPEED = 1;
export const PLAYER_SPEED = 3;
export const ENEMY_SPEED = 1.5;
export const ATTACK_DMG = 25;

// Frame rate
export const FRAME_RATE = 60;
export const FRAME_DURATION = 1000 / FRAME_RATE;

// Game states
export const GAME_STATES = {
  RUNNING: 'running',
  PAUSED: 'paused',
  GAME_OVER: 'gameOver'
};
