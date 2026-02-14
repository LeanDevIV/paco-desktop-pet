class PetState {
  constructor(vitalsConfig = {}) {
    this.visualState = "IDLE";
    this.movementMode = "IDLE";
    this.direction = { x: 0, y: 0 };
    this.isBusy = false;

    this.vitals = {
      hunger: 80,
      energy: 100,
      affection: 0,
    };

    this.vitalsConfig = {
      tickRate: 5000,
      hungerDecay: 2,
      energyDecayWalk: 3,
      energyRegenIdle: 2,
      energyRegenSleep: 34,
      ...vitalsConfig,
    };
  }

  updateVitals() {
    // Lógica de vitals (sin UI)
    this.vitals.hunger = Math.max(
      0,
      this.vitals.hunger - this.vitalsConfig.hungerDecay,
    );

    if (this.visualState === "SLEEPING") {
      this.vitals.energy = Math.min(
        100,
        this.vitals.energy + this.vitalsConfig.energyRegenSleep,
      );
    } else if (this.movementMode === "WALKING") {
      this.vitals.energy = Math.max(
        0,
        this.vitals.energy - this.vitalsConfig.energyDecayWalk,
      );
    } else {
      this.vitals.energy = Math.min(
        100,
        this.vitals.energy + this.vitalsConfig.energyRegenIdle,
      );
    }

    return this.vitals; // Retorna para que el controlador reaccione
  }

  makeDecision(cursorDistance) {
    // Retorna qué hacer NEXT, sin efectos secundarios
    if (this.visualState === "EATING" || this.isBusy) return null;
    if (this.visualState === "SLEEPING" && this.vitals.energy < 100)
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
    this.vitals.hunger = Math.min(100, this.vitals.hunger + amount);
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
      this.visualState = newState;
      return true; // Indica que cambió
    }
    return false;
  }
}

module.exports = PetState;
