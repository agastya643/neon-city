export const FIXED_TIMESTEP = 1 / 60;

export const QUALITY_ORDER = ['low', 'medium', 'high', 'ultra'];

export const GRAPHICS_PRESETS = {
  low: {
    label: 'Low',
    pixelRatio: 1,
    shadowMap: false,
    fog: 0.005,
    density: 0.5,
    particles: 90,
  },
  medium: {
    label: 'Medium',
    pixelRatio: 1.2,
    shadowMap: true,
    fog: 0.004,
    density: 0.8,
    particles: 130,
  },
  high: {
    label: 'High',
    pixelRatio: 1.4,
    shadowMap: true,
    fog: 0.0035,
    density: 1,
    particles: 180,
  },
  ultra: {
    label: 'Ultra',
    pixelRatio: 1.5,
    shadowMap: true,
    fog: 0.003,
    density: 1.2,
    particles: 220,
  },
};

export const DEFAULT_SETTINGS = {
  quality: 'high',
  showFps: true,
  autoQuality: true,
  fullscreen: false,
};
