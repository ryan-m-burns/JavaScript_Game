// Canvas dimensions
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

// Game dimensions
export const TILE_SIZE = 40;
export const PROJECTILE_SIZE = 5;
export const SPRITE_SIZE = 32;
export const ENEMY_SIZE = 24;
export const BOSS_SIZE = 48;
export const PLAYER_SIZE = 32;
export const PICKUP_SIZE = 16;

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
  MENU: 'menu',
  RUNNING: 'running',
  PAUSED: 'paused',
  GAME_OVER: 'gameOver'
};

export const SCORE_VALUES = {
  ENEMY_KILL: 100,
  FLOOR_CLEAR: 500,
  BOSS_KILL: 1000
};

export const DIFFICULTY_SETTINGS = {
  easy: {
    playerHealth: 150,
    blockReduction: 0.75,
    scoreMultiplier: 0.5,
    enemyMod: 0.5,
    enemyCountMod: 0.75,
    healthDropRate: 0.008,
    bossHealthMod: 0.75,
    bossDamageMod: 0.5
  },
  normal: {
    playerHealth: 100,
    blockReduction: 0.5,
    scoreMultiplier: 1.0,
    enemyMod: 1.0,
    enemyCountMod: 1.0,
    healthDropRate: 0.005,
    bossHealthMod: 1.0,
    bossDamageMod: 1.0
  },
  hard: {
    playerHealth: 75,
    blockReduction: 0.25,
    scoreMultiplier: 2.0,
    enemyMod: 1.5,
    enemyCountMod: 1.5,
    healthDropRate: 0.003,
    bossHealthMod: 2,
    bossDamageMod: 1.5
  }
};

export const PROJECTILE_TYPES = {
  player: {
    baseSize: PROJECTILE_SIZE,
    baseDamage: 15,
    baseSpeed: 6,
    color: '#00ff00' // Green for player projectiles
  },
  enemy: {
    baseSize: PROJECTILE_SIZE,
    baseDamage: 10,
    baseSpeed: 4,
    color: '#ff0000' // Red for enemy projectiles
  },
  boss: {
    baseSize: PROJECTILE_SIZE * 1.5,
    baseDamage: 20,
    baseSpeed: 3,
    color: '#ffa500' // Orange for boss projectiles
  }
};

export const ENEMY_TYPES = {
  normal: {
    baseHealth: 50,
    baseDamage: 10,
    shootRange: 300,
    shootChance: 0.01,
    projectileSpeed: 1
  },
  boss: {
    baseHealth: 200,
    baseDamage: 20,
    shootRange: 400,
    shootChance: 0.015,
    projectileSpeed: 1.1
  }
};
