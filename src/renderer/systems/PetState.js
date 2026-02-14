const Vitals = require("./Vitals");
const VitalsConfig = require("./VitalsConfig");

class PetState {
  constructor(vitalsConfig = {}) {
    this.visualState = "IDLE";
    this.movementMode = "IDLE";
    this.direction = { x: 0, y: 0 };
    this.isBusy = false;

    // Use the new Vitals system
    this.vitalsSystem = new Vitals();
    // Expose stats object for compatibility with PetBrain/UI
    this.vitals = this.vitalsSystem.getStats();
    // Expose config for PetBrain
    this.vitalsConfig = VitalsConfig;
  }

  updateVitals() {
    // Delegate biological logic to Vitals system
    this.vitals = this.vitalsSystem.tick(this.visualState, this.movementMode);

    // Check if we need to force state changes based on vitals
    if (this.vitalsSystem.isExhausted && this.visualState !== "SLEEPING") {
      this.sleep();
    }

    return this.vitals; // Returns { hunger, energy, affection }
  }

  makeDecision(cursorDistance) {
    // Retorna qué hacer NEXT, sin efectos secundarios
    if (
      this.visualState === "EATING" ||
      this.visualState === "HELD" ||
      this.visualState === "LOVE" ||
      this.isBusy
    )
      return null;

    // If sleeping, only wake up if energetic enough?
    // For now, if sleeping and not fully rested, stay asleep
    if (
      this.visualState === "SLEEPING" &&
      this.vitals.energy < VitalsConfig.MAX_ENERGY
    )
      return null;

    if (cursorDistance < 100) {
      return { action: "STOP_AND_STARE" };
    }

    const rand = Math.random();
    if (rand < 0.5) {
      return { action: "WALK", direction: this._pickRandomDirection() };
    } else {
      return { action: "IDLE" };
    }
  }

  _pickRandomDirection() {
    let x = 0,
      y = 0;
    while (x === 0 && y === 0) {
      x = Math.random() > 0.5 ? 1 : -1;
      y = Math.random() > 0.5 ? 1 : -1;
      if (Math.random() > 0.8) x = 0;
      else if (Math.random() > 0.8) y = 0;
    }
    return { x, y };
  }

  feed(amount = 50) {
    this.vitalsSystem.feed(amount);
    // Vitals will update on next tick or we could update local ref now
    this.vitals = this.vitalsSystem.getStats();
    return this.vitals;
  }

  sleep() {
    this.visualState = "SLEEPING";
    this.movementMode = "IDLE";
  }

  wakeUp() {
    this.visualState = "IDLE";
    this.movementMode = "IDLE";
  }

  setVisualState(newState) {
    if (this.visualState !== newState) {
      const oldState = this.visualState;
      this.visualState = newState;
      console.log(`PACO STATE: ${oldState} > ${newState}`);
      return true; // Indica que cambió
    }
    return false;
  }
}

module.exports = PetState;
