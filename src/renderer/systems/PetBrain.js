// src/renderer/systems/PetBrain.js
const { ipcRenderer } = require("electron");

class PetBrain {
  constructor() {
    this.state = "IDLE"; // IDLE, WALKING, EATING
    this.timers = {};
    this.position = { x: 0, y: 0 };
    this.direction = { x: 0, y: 0 };

    // Config
    this.DECISION_RATE = 2000;
    this.MOVE_SPEED = 5;
  }

  init() {
    console.log("🧠 PetBrain: Online");
    this.sprite = document.getElementById("paco-sprite");
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
    if (this.state === "EATING") return;

    const rand = Math.random();
    // 40% chance to walk, 60% idle
    if (rand > 0.6) {
      this.changeState("WALKING");
    } else {
      this.changeState("IDLE");
    }
  }

  changeState(newState) {
    if (this.state === newState) return;

    console.log(`State change: ${this.state} -> ${newState}`);
    this.state = newState;

    if (newState === "WALKING") {
      this.sprite.classList.add("walk-anim");
      this.pickRandomDirection();
    } else if (newState === "IDLE") {
      this.sprite.classList.remove("walk-anim");
    } else if (newState === "EATING") {
      this.sprite.classList.remove("walk-anim");
      // Add visual feedback for eating
      this.sprite.classList.add("eating");
    }
  }

  pickRandomDirection() {
    // Random direction: -1, 0, or 1 for both axes
    // Filter out 0,0 to ensure some movement if walking
    let x = 0,
      y = 0;
    while (x === 0 && y === 0) {
      x = Math.random() > 0.5 ? 1 : -1;
      y = Math.random() > 0.5 ? 1 : -1;

      // Occasionally allow partial axis movement (just X or just Y)
      if (Math.random() > 0.8) x = 0;
      else if (Math.random() > 0.8) y = 0;
    }

    this.direction = { x, y };
    this.updateSpriteOrientation();
  }

  updateSpriteOrientation() {
    // Clear previous direction classes
    this.sprite.classList.remove(
      "facing-up",
      "facing-down",
      "facing-left",
      "facing-right",
    );

    const { x, y } = this.direction;

    // Determine primary facing direction
    // If moving horizontally, face left/right
    // If moving vertically, face up/down
    // If moving diagonally, prefer horizontal facing (arbitrary choice)

    if (x !== 0) {
      if (x > 0) this.sprite.classList.add("facing-right");
      else this.sprite.classList.add("facing-left");
    } else if (y !== 0) {
      if (y > 0) this.sprite.classList.add("facing-down");
      else this.sprite.classList.add("facing-up");
    } else {
      // Default fallback
      this.sprite.classList.add("facing-down");
    }
  }

  updatePhysics() {
    if (this.state !== "WALKING") return;

    // Calculate movement delta
    const delta = {
      x: this.direction.x * this.MOVE_SPEED,
      y: this.direction.y * this.MOVE_SPEED,
    };

    // Send to main process
    ipcRenderer.send("paco-move", delta);
  }

  interact() {
    console.log("Interact triggered!");
    if (this.state === "EATING") return;

    // Force EATING state
    this.changeState("EATING");
    this.sprite.classList.add("facing-down"); // Face user when eating

    // Stop moving immediately
    this.direction = { x: 0, y: 0 };

    // Reset after animation
    setTimeout(() => {
      this.sprite.classList.remove("eating");
      this.makeDecision(); // Pick new state immediately
    }, 2000); // 2 seconds interaction
  }
}

module.exports = new PetBrain();
