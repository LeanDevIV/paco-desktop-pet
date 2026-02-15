/**
 * Configuration for Pet Vitals (Needs System)
 */
const VitalsConfig = {
  // Limits
  MAX_HUNGER: 100,
  MAX_ENERGY: 100,
  MAX_AFFECTION: 100,

  // Update Rates
  TICK_RATE: 5000, // How often vitals update (ms)

  // Decay/Regen Rates (per tick)
  HUNGER_DECAY: 2, // Gets hungry / tick
  ENERGY_DECAY_WALK: 3, // Loses energy when walking
  ENERGY_REGEN_IDLE: 2, // Gains energy when standing still
  ENERGY_REGEN_SLEEP: 34, // Gains energy fast when sleeping

  // Thresholds
  HUNGER_LOW: 30, // Shows thought bubble
  ENERGY_CRITICAL: 10, // Slow movement
  ENERGY_EXHAUSTED: 0, // Forces sleep
};

module.exports = VitalsConfig;
