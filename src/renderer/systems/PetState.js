const Vitals = require("./Vitals");
const VitalsConfig = require("./VitalsConfig");
const PetStorage = require("./PetStorage");
const LevelSystem = require("./LevelSystem");

class PetState {
  constructor(vitalsConfig = {}) {
    this.visualState = "IDLE";
    this.movementMode = "IDLE";
    this.direction = { x: 0, y: 0 };
    this.isBusy = false;

    // Subsystems
    this.storage = new PetStorage();
    this.vitalsSystem = new Vitals();

    // Load Data
    const savedData = this.storage.load();
    if (savedData) {
      console.log("📂 Loaded Save:", savedData);

      // Apply offline decay
      const decay = this.storage.calculateOfflineDecay(savedData.timestamp);

      // Restore vitals with decay
      this.vitalsSystem.hunger = Math.max(
        0,
        savedData.vitals.hunger - decay.hunger,
      );
      this.vitalsSystem.energy = Math.max(
        0,
        savedData.vitals.energy - decay.energy,
      );
      this.vitalsSystem.affection = Math.max(
        0,
        savedData.vitals.affection - decay.affection,
      );

      // Restore Level/XP
      this.levelSystem = new LevelSystem(savedData.xp || 0);
    } else {
      console.log("⭐️ New Game Started");
      this.levelSystem = new LevelSystem(0);
    }

    // Expose stats object for compatibility with PetBrain/UI
    this.vitals = this.vitalsSystem.getStats();
    // Copy level info to vitals object for UI access
    Object.assign(this.vitals, this.levelSystem.getStats());

    this.vitalsConfig = VitalsConfig;
  }

  updateVitals() {
    // Delegate biological logic to Vitals system
    this.vitals = this.vitalsSystem.tick(this.visualState, this.movementMode);

    // XP Logic: Gain XP if happy (Average stats > 50%)
    const avgStats =
      (this.vitals.hunger + this.vitals.energy + this.vitals.affection) / 3;
    if (avgStats > 50) {
      this.levelSystem.addXP(0.5); // Slow progression
    }

    // Update exposed object with latest level info
    Object.assign(this.vitals, this.levelSystem.getStats());

    // Auto-Save every ~30 ticks (approx 1 min if tick is 2s)
    if (Math.random() < 0.05) {
      this.save();
    }

    return this.vitals; // Returns { hunger, energy, affection, xp, level, ... }
  }

  save() {
    const data = {
      vitals: this.vitalsSystem.getStats(),
      xp: this.levelSystem.xp,
      level: this.levelSystem.level,
    };
    this.storage.save(data);
  }

  makeDecision() {
    // Retorna qué hacer NEXT, sin efectos secundarios
    if (
      this.visualState === "EATING" ||
      this.visualState === "HELD" ||
      this.visualState === "LOVE" ||
      this.isBusy
    )
      return null;

    // Critical State Override: If energy or hunger is 0, do nothing (PetBrain handles corner logic)
    if (this.vitals.energy <= 0 || this.vitals.hunger <= 0) return null;

    // If sleeping, only wake up if energetic enough?
    // For now, if sleeping and not fully rested, stay asleep
    if (
      this.visualState === "SLEEPING" &&
      this.vitals.energy < VitalsConfig.MAX_ENERGY
    )
      return null;

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

  increaseAffection(amount) {
    this.vitalsSystem.affection = Math.min(
      100,
      this.vitalsSystem.affection + amount,
    );
    // Update exposed stats immediately
    Object.assign(this.vitals, this.vitalsSystem.getStats());
  }

  setVisualState(state) {
    if (this.visualState !== state) {
      console.log(`PACO STATE: ${this.visualState} > ${state}`);
      this.visualState = state;
    }
  }
}

module.exports = PetState;
