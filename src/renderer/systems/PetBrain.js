// src/renderer/systems/PetBrain.js
const { ipcRenderer } = require("electron");

class PetBrain {
  constructor() {
    this.visualState = "IDLE"; // IDLE, WALKING, EATING, SLEEPING
    this.movementMode = "IDLE"; // IDLE, WALKING
    this.timers = {};
    this.direction = { x: 0, y: 0 };

    // Config
    this.DECISION_RATE = 2500;
    this.MOVE_SPEED = 5;
  }

  init() {
    console.log("🧠 PetBrain: Online");
    this.sprite = document.getElementById("paco-sprite");
    // this.container = document.getElementById("paco-container");
    this.startLifeCycle();
  }

  startLifeCycle() {
    this.timers.decision = setInterval(
      () => this.makeDecision(),
      this.DECISION_RATE,
    );
    this.timers.physics = setInterval(() => this.updatePhysics(), 50);
  }

  makeDecision() {
    if (this.visualState === "EATING") return;

    const rand = Math.random();

    // 10% Sleep, 40% Walk, 50% Idle
    if (rand < 0.1) {
      this.setVisualState("SLEEPING");
      this.movementMode = "IDLE";
    } else if (rand < 0.5) {
      this.setVisualState("WALKING");
      this.movementMode = "WALKING";
      this.pickRandomDirection();
    } else {
      this.setVisualState("IDLE");
      this.movementMode = "IDLE";
    }
  }

  setVisualState(newState) {
    if (this.visualState === newState) return;
    console.log(`Visual: ${this.visualState} -> ${newState}`);
    this.visualState = newState;
    this.updateClasses();
  }

  updateClasses() {
    // Clear all state classes
    this.sprite.classList.remove(
      "state-idle",
      "state-walking",
      "state-eating",
      "state-sleeping",
    );

    // Add current state class
    this.sprite.classList.add(`state-${this.visualState.toLowerCase()}`);

    // Handle direction classes
    if (this.visualState === "WALKING" || this.visualState === "IDLE") {
      this.applyDirectionClasses();
    } else {
      this.sprite.classList.remove(
        "facing-up",
        "facing-down",
        "facing-left",
        "facing-right",
      );
    }
  }

  pickRandomDirection() {
    let x = 0,
      y = 0;
    while (x === 0 && y === 0) {
      x = Math.random() > 0.5 ? 1 : -1;
      y = Math.random() > 0.5 ? 1 : -1;

      if (Math.random() > 0.8) x = 0;
      else if (Math.random() > 0.8) y = 0;
    }
    this.direction = { x, y };
    if (this.visualState === "WALKING" || this.visualState === "IDLE") {
      this.applyDirectionClasses();
    }
  }

  applyDirectionClasses() {
    this.sprite.classList.remove(
      "facing-up",
      "facing-down",
      "facing-left",
      "facing-right",
    );

    const { x, y } = this.direction;
    if (x !== 0) {
      if (x > 0) this.sprite.classList.add("facing-right");
      else this.sprite.classList.add("facing-left");
    } else if (y !== 0) {
      if (y > 0) this.sprite.classList.add("facing-down");
      else this.sprite.classList.add("facing-up");
    } else {
      this.sprite.classList.add("facing-down");
    }
  }

  updatePhysics() {
    if (this.movementMode !== "WALKING") return;

    const delta = {
      x: this.direction.x * this.MOVE_SPEED,
      y: this.direction.y * this.MOVE_SPEED,
    };

    ipcRenderer.send("paco-move", delta);
  }

  interact() {
    console.log("Interact: Munching!");
    const previousMovementMode = this.movementMode;
    this.setVisualState("EATING");

    setTimeout(() => {
      if (this.visualState === "EATING") {
        // Revert visual state to match the current movement mode
        // If movement mode is WALKING, we go to WALKING visual
        // If IDLE, we go to IDLE visual
        // Note: setVisualState handles updateClasses
        this.setVisualState(
          this.movementMode === "WALKING" ? "WALKING" : "IDLE",
        );
      }
    }, 2000);
  }
}

module.exports = new PetBrain();
