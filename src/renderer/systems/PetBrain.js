const { ipcRenderer } = require("electron");
const PetState = require("./PetState");
const PetInput = require("./PetInput");
const PetAnimator = require("./PetAnimator");
const PetAudio = require("./PetAudio");
const PetPhysics = require("./PetPhysics");

class PetBrain {
  constructor() {
    this.state = new PetState();
    this.input = null;
    this.animator = null;
    this.audio = new PetAudio();
    this.physics = new PetPhysics();

    this.timers = {};
    this.cursorGlobal = { x: 0, y: 0 };

    // Config
    this.DECISION_RATE = 2500;

    this.setupIPC();
  }

  init() {
    console.log("🧠 PetBrain: Online");
    this.sprite = document.getElementById("paco-sprite");
    this.container = document.getElementById("paco-container");

    // Inicializar subsistemas
    this.animator = new PetAnimator(this.sprite);
    this.input = new PetInput(this.container, {
      onClick: () => this.interact(),
      onDragStart: () => this.startDrag(),
      onDrag: (delta) => this.handleDrag(delta),
      onDragEnd: () => this.endDrag(),
      onContextMenu: () => ipcRenderer.invoke("show-context-menu"),
    });

    this.startLifeCycle();
    this.updateVisuals();
  }

  startLifeCycle() {
    this.timers.decision = setInterval(
      () => this.makeDecision(),
      this.DECISION_RATE,
    );
    this.timers.physics = setInterval(() => this.updatePhysics(), 50);
    this.timers.vitals = setInterval(
      () => this.updateVitals(),
      this.state.vitalsConfig.TICK_RATE, // Accessing exposed config
    );
  }

  makeDecision() {
    const decision = this.state.makeDecision();
    if (!decision) return;

    if (Math.random() < 0.1) this.audio.playRandomSqueak();

    switch (decision.action) {
      case "WALK":
        this.state.setVisualState("WALKING");
        this.state.direction = decision.direction;
        this.state.movementMode = "WALKING";
        this.updateVisuals();
        break;
      case "IDLE":
        this.state.setVisualState("IDLE");
        this.state.movementMode = "IDLE";
        this.updateVisuals();
        break;
      case "STOP_AND_STARE":
        this.state.setVisualState("IDLE");
        this.state.movementMode = "IDLE";
        this.updateVisuals();
        break;
    }
  }

  updateVitals() {
    const vitals = this.state.updateVitals();

    // Ajustar velocidad si está cansado
    if (vitals.energy < 20) {
      this.physics.setSpeed(2);
    } else {
      this.physics.setSpeed(5);
    }

    // Log stats only if they change (simple check)
    const statsStr = `stats: 🧀${vitals.hunger} ⚡${vitals.energy} ❤️${vitals.affection}`;
    if (this._lastStatsLog !== statsStr) {
      console.log(statsStr);
      this._lastStatsLog = statsStr;
    }

    // Show thought bubble based on needs (run BEFORE critical check)
    const thoughtBubble = document.getElementById("thought-bubble");
    if (vitals.hunger < 30) {
      thoughtBubble.textContent = "🧀"; // Cheese
      thoughtBubble?.classList.add("visible");
    } else if (vitals.energy < 20) {
      thoughtBubble.textContent = "💤"; // Sleep
      thoughtBubble?.classList.add("visible");
    } else {
      thoughtBubble?.classList.remove("visible");
    }

    // Check critical states (Hunger or Energy <= 0)
    if (vitals.energy <= 0 || vitals.hunger <= 0) {
      // Force movement to bottom-right corner
      // We do NOT check for SLEEPING here, we wake him/move him regardless.

      // Target: Bottom-Right corner, allowing for 300x300 window size
      // We target screen.width - 300 (window width) - margin
      const windowSize = 300;
      const targetX = window.screen.width - windowSize;
      const targetY = window.screen.height - windowSize - 40; // A bit higher to clear taskbar

      // Current position (Top-Left of window)
      const currentX = window.screenX;
      const currentY = window.screenY;

      const dx = targetX - currentX;
      const dy = targetY - currentY;

      if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
        // Move towards corner
        this.state.movementMode = "WALKING";
        this.state.visualState = "WALKING";
        this.state.direction = { x: Math.sign(dx), y: Math.sign(dy) };
      } else {
        // Arrived at corner, stay IDLE
        this.state.movementMode = "IDLE";
        this.state.visualState = "IDLE";
        this.state.direction = { x: 0, y: 0 }; // Face front
      }

      this.updateVisuals();
      // Prevent normal behavior
      return;
    }
  }

  updatePhysics() {
    this.physics.setDirection(this.state.direction);
    this.physics.setMovementMode(this.state.movementMode);
    this.physics.update();
  }

  updateVisuals() {
    this.animator.setVisualState(this.state.visualState);
    if (
      this.state.visualState === "WALKING" ||
      this.state.visualState === "IDLE"
    ) {
      this.animator.setDirection(this.state.direction);
    }
  }

  interact() {
    // Prevent interaction if in critical state (0 energy/hunger)
    if (this.state.vitals.energy <= 0 || this.state.vitals.hunger <= 0) return;

    if (this.state.visualState === "SLEEPING") {
      this.state.wakeUp();
      this.audio.playSqueak("squeak3");
      this.updateVisuals();
      return;
    }

    if (this.state.isBusy) return;
    this.state.isBusy = true;

    this.state.setVisualState("IDLE");
    this.state.movementMode = "IDLE";

    setTimeout(() => {
      this.state.setVisualState("LOVE");
      this.state.increaseAffection(5);
      this.animator.setVisualState("LOVE");
      this.audio.playSqueak("squeak1");

      setTimeout(() => {
        this.state.setVisualState("IDLE");
        this.animator.setVisualState("IDLE");

        setTimeout(() => {
          this.state.isBusy = false;
        }, 500);
      }, 1200);
    }, 500);
  }

  startDrag() {
    this.state.setVisualState("HELD");
    // CRITICAL: Stop physics movement immediately
    this.state.movementMode = "IDLE";
    this.physics.setMovementMode("IDLE");

    this.animator.setVisualState("HELD");
    this.animator.setRotation(0);
  }

  handleDrag(delta) {
    ipcRenderer.send("paco-drag", delta);
    const rotation = -delta.x * 15;
    this.animator.setRotation(rotation);
  }

  endDrag() {
    this.animator.resetRotation();
    this.state.setVisualState("IDLE");
    this.state.movementMode = "IDLE";
    this.animator.setVisualState("IDLE");
  }

  feed() {
    this.state.feed();
    this.audio.playSqueak("squeak1");
    this.state.setVisualState("EATING");
    this.state.movementMode = "IDLE";
    this.animator.setVisualState("EATING");

    clearTimeout(this.timers.interaction);
    this.timers.interaction = setTimeout(() => {
      this.state.setVisualState("IDLE");
      this.animator.setVisualState("IDLE");
    }, 1500);
  }

  setupIPC() {
    ipcRenderer.on("feed-paco", () => this.feed());
    ipcRenderer.on("sleep-paco", () => {
      this.state.sleep();
      this.updateVisuals();
    });
  }
}

module.exports = new PetBrain();
