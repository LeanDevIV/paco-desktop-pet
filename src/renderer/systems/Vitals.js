const VitalsConfig = require("./VitalsConfig");

class Vitals {
  constructor() {
    this.hunger = 80; // Starts well fed
    this.energy = 100; // Starts fully rested
    this.affection = 0; // Starts neutral
  }

  /**
   * Updates vitals based on current activity
   * @param {string} visualState - Current visual state (e.g., WALKING, IDLE)
   * @param {string} movementMode - Current movement mode
   */
  tick(visualState, movementMode) {
    // Hunger Logic: Always decays over time
    this.hunger = Math.max(0, this.hunger - VitalsConfig.HUNGER_DECAY);

    // Energy Logic
    if (visualState === "SLEEPING") {
      this.energy = Math.min(
        VitalsConfig.MAX_ENERGY,
        this.energy + VitalsConfig.ENERGY_REGEN_SLEEP,
      );
    } else if (movementMode === "WALKING") {
      this.energy = Math.max(0, this.energy - VitalsConfig.ENERGY_DECAY_WALK);
    } else {
      // Resting (Idle/Held/Eating)
      this.energy = Math.min(
        VitalsConfig.MAX_ENERGY,
        this.energy + VitalsConfig.ENERGY_REGEN_IDLE,
      );
    }

    return this.getStats();
  }

  feed(amount = 50) {
    this.hunger = Math.min(VitalsConfig.MAX_HUNGER, this.hunger + amount);
    return this.hunger;
  }

  pet(amount = 5) {
    this.affection = Math.min(
      VitalsConfig.MAX_AFFECTION,
      this.affection + amount,
    );
    return this.affection;
  }

  getStats() {
    return {
      hunger: this.hunger,
      energy: this.energy,
      affection: this.affection,
    };
  }

  // Getters for quick checks
  get isHungry() {
    return this.hunger < VitalsConfig.HUNGER_LOW;
  }
  get isTired() {
    return this.energy < VitalsConfig.ENERGY_CRITICAL;
  }
  get isExhausted() {
    return this.energy <= VitalsConfig.ENERGY_EXHAUSTED;
  }
}

module.exports = Vitals;
