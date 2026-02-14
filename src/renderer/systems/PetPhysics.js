const { ipcRenderer } = require("electron");

class PetPhysics {
  constructor(config = {}) {
    this.MOVE_SPEED = config.moveSpeed || 5;
    this.direction = { x: 0, y: 0 };
    this.movementMode = "IDLE";
  }

  setDirection(direction) {
    this.direction = direction;
  }

  setMovementMode(mode) {
    this.movementMode = mode;
  }

  setSpeed(speed) {
    this.MOVE_SPEED = speed;
  }

  update() {
    if (this.movementMode !== "WALKING") return;

    const delta = {
      x: this.direction.x * this.MOVE_SPEED,
      y: this.direction.y * this.MOVE_SPEED,
    };

    ipcRenderer.send("paco-move", delta);
  }
}

module.exports = PetPhysics;
