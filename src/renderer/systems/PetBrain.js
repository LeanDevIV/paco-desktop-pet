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
      this.state.vitalsConfig.tickRate,
    );

    ipcRenderer.on("cursor-update", (event, point) => {
      this.cursorGlobal = point;
      this.checkWatchBehavior();
    });
  }

  makeDecision() {
    const pacoX = window.screenX + 24;
    const pacoY = window.screenY + 24;
    const dist = Math.hypot(
      this.cursorGlobal.x - pacoX,
      this.cursorGlobal.y - pacoY,
    );

    const decision = this.state.makeDecision(dist);
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

    // Check critical states
    if (vitals.energy <= 0 && this.state.visualState !== "SLEEPING") {
      this.state.sleep();
      this.physics.setMovementMode("IDLE");
      this.updateVisuals();
    }

    // Show hunger bubble
    const thoughtBubble = document.getElementById("thought-bubble");
    if (vitals.hunger < 30) {
      thoughtBubble?.classList.add("visible");
    } else {
      thoughtBubble?.classList.remove("visible");
    }

    console.log(
      `stats: 🧀${vitals.hunger} ⚡${vitals.energy} ❤️${vitals.affection}`,
    );
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
      this.state.vitals.affection = Math.min(
        100,
        this.state.vitals.affection + 5,
      );
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

  checkWatchBehavior() {
    if (
      this.state.visualState === "SLEEPING" ||
      this.state.visualState === "EATING" ||
      this.state.visualState === "HELD" ||
      this.input.isDragging
    )
      return;

    const pacoX = window.screenX + 24;
    const pacoY = window.screenY + 24;
    const dist = Math.hypot(
      this.cursorGlobal.x - pacoX,
      this.cursorGlobal.y - pacoY,
    );

    if (dist < 100) {
      const dx = this.cursorGlobal.x - pacoX;
      const dy = this.cursorGlobal.y - pacoY;

      if (Math.abs(dx) > Math.abs(dy)) {
        this.state.direction = { x: Math.sign(dx), y: 0 };
      } else {
        this.state.direction = { x: 0, y: Math.sign(dy) };
      }

      this.animator.setDirection(this.state.direction);
    }
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
