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

    // Vitals
    this.vitals = {
      hunger: 80, // 0-100 (0 = Starving)
      energy: 100, // 0-100 (0 = Exhausted)
      affection: 0, // 0-100 (100 = Love)
    };

    // Vitals Config (Changes per tick)
    this.vitalsConfig = {
      tickRate: 5000, // Update every 5s
      hungerDecay: 2,
      energyDecayWalk: 3,
      energyRegenIdle: 2,
      energyRegenSleep: 34, // 34 * 3 ticks (~15s) = 102 (Full)
    };

    // Audio
    this.squeak1 = new Audio("./assets/Squeaking.mp3");
    this.squeak2 = new Audio("./assets/Squeaking-2.mp3");
    this.squeak3 = new Audio("./assets/Squeaking-3.mp3");
    this.squeaks = [this.squeak1, this.squeak2, this.squeak3];

    // Dragging State
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.isMouseDown = false;
    this.isBusy = false; // For blocking decisions during sequences

    // Cursor Awareness
    this.cursorGlobal = { x: 0, y: 0 };
    ipcRenderer.on("cursor-update", (event, point) => {
      this.cursorGlobal = point;
      this.checkWatchBehavior(); // Check frequently
    });
  }

  init() {
    console.log("🧠 PetBrain: Online");
    this.sprite = document.getElementById("paco-sprite");
    this.container = document.getElementById("paco-container"); // Uncommented and used
    this.startLifeCycle();
    this.setupInteractions();
    this.updateClasses(); // Apply initial visual state (IDLE)
  }

  setupInteractions() {
    this.container.addEventListener("mousedown", (e) =>
      this.handleMouseDown(e),
    );
    document.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    document.addEventListener("mouseup", (e) => this.handleMouseUp(e));

    // Context Menu
    window.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      ipcRenderer.invoke("show-context-menu");
    });

    // Listen for Feed command
    ipcRenderer.on("feed-paco", () => this.feed());

    // Listen for Sleep command
    ipcRenderer.on("sleep-paco", () => this.goToSleep());
  }

  startLifeCycle() {
    this.timers.decision = setInterval(
      () => this.makeDecision(),
      this.DECISION_RATE,
    );
    this.timers.physics = setInterval(() => this.updatePhysics(), 50);
    this.timers.vitals = setInterval(
      () => this.updateVitals(),
      this.vitalsConfig.tickRate,
    );
  }

  updateVitals() {
    // 1. Hunger Decay
    this.vitals.hunger = Math.max(
      0,
      this.vitals.hunger - this.vitalsConfig.hungerDecay,
    );

    // 2. Energy Logic
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
      // Idle
      this.vitals.energy = Math.min(
        100,
        this.vitals.energy + this.vitalsConfig.energyRegenIdle,
      );
    }

    // Low Energy Speed Modifier
    if (this.vitals.energy < 20) {
      this.MOVE_SPEED = 2; // Tired walk
    } else {
      this.MOVE_SPEED = 5; // Normal speed
    }

    // Logging (Debug)
    console.log(
      `stats: 🧀${this.vitals.hunger} ⚡${this.vitals.energy} ❤️${this.vitals.affection}`,
    );

    // Check Critical States
    if (this.vitals.energy <= 0 && this.visualState !== "SLEEPING") {
      console.log("Passed out from exhaustion!");
      this.setVisualState("SLEEPING");
      this.movementMode = "IDLE";
    }

    // Check Hunger
    const thoughtBubble = document.getElementById("thought-bubble");
    if (this.vitals.hunger < 30) {
      if (thoughtBubble) thoughtBubble.classList.add("visible");
      // Force chase/beg behavior if we implement it later
    } else {
      if (thoughtBubble) thoughtBubble.classList.remove("visible");
    }
  }

  makeDecision() {
    // blocked by actions
    if (this.visualState === "EATING" || this.isDragging || this.isBusy) return;

    // blocked by sleep (unless fully rested)
    if (this.visualState === "SLEEPING" && this.vitals.energy < 100) return;

    // If sleeping and energy is full, wake up naturally?
    // Let's allow the random logic below to potentially pick WALKING/IDLE, which effectively wakes him.

    const rand = Math.random();

    if (Math.random() < 0.1) {
      this.playRandomSqueak();
    }

    // Chase Mode (Curious)
    // Check distance to cursor
    // We need window position to calculate distance relative to Paco
    // But we only have screen coords. Window position is handled by Main...
    // Wait, renderer knows its screen position via window.screenX/Y!
    const pacoX = window.screenX + 24; // Center
    const pacoY = window.screenY + 24;
    const dist = Math.hypot(
      this.cursorGlobal.x - pacoX,
      this.cursorGlobal.y - pacoY,
    );

    // STOP & STARE override in decision loop (prevent random walking when close)
    // If nearby (within 100px), force IDLE and face cursor (behavior handled in checkWatchBehavior)
    if (dist < 100) {
      if (this.visualState === "WALKING") {
        this.setVisualState("IDLE");
        this.movementMode = "IDLE";
      }
      return;
    }

    // Chase Mode (Curious) - DISABLED
    // We removed the chase logic to prevent him from following the cursor.
    // Instead, he just wanders randomly unless close.

    // 50% Walk, 50% Idle
    if (rand < 0.5) {
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
      "state-eating",
      "state-sleeping",
      "state-eating",
      "state-sleeping",
      "state-held",
      "state-love",
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

    // Reset manual transform (rotation) when changing states
    this.sprite.style.transform = "";
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
    if (this.movementMode !== "WALKING" || this.isDragging) return;

    const delta = {
      x: this.direction.x * this.MOVE_SPEED,
      y: this.direction.y * this.MOVE_SPEED,
    };

    ipcRenderer.send("paco-move", delta);
  }

  interact() {
    // Wake up if sleeping
    if (this.visualState === "SLEEPING") {
      console.log("Interact: Waking up!");
      this.setVisualState("IDLE");
      this.movementMode = "IDLE";
      this.playSqueak(this.squeak3); // Groggy squeak?
      return;
    }

    if (this.isBusy) return; // Prevent spamming interruptions
    this.isBusy = true;

    // 1. Initial Pause (IDLE) - 0.5s
    this.setVisualState("IDLE");
    this.movementMode = "IDLE";

    setTimeout(() => {
      // 2. Love State - 1.2s
      console.log("Interact: Love! ❤️");
      this.setVisualState("LOVE");

      // Increase Affection
      this.vitals.affection = Math.min(100, this.vitals.affection + 5);

      // Play Squeak
      this.playSqueak(this.squeak1);

      setTimeout(() => {
        // 3. Post-Love Pause (IDLE) - 0.5s
        this.setVisualState("IDLE");

        setTimeout(() => {
          // 4. Resume Normal Behavior
          this.isBusy = false;
        }, 500);
      }, 1200); // Love animation duration
    }, 500); // Initial delay
  }

  // ... Drag Logic ...

  handleMouseDown(e) {
    if (e.button !== 0) return; // Only Left Click
    this.isMouseDown = true;
    this.dragStartX = e.screenX;
    this.dragStartY = e.screenY;
  }

  handleMouseMove(e) {
    if (!this.isMouseDown) return;

    if (!this.isDragging) {
      // Check threshold to avoid accidental drags on clicks
      const dist = Math.hypot(
        e.screenX - this.dragStartX,
        e.screenY - this.dragStartY,
      );
      if (dist > 5) {
        this.startDrag();
      }
    }

    if (this.isDragging) {
      const deltaX = e.screenX - this.dragStartX;
      const deltaY = e.screenY - this.dragStartY;

      ipcRenderer.send("paco-drag", { x: deltaX, y: deltaY });

      // Physics Swing Logic
      // Tilt based on horizontal velocity (deltaX).
      // Negative deltaX (moving left) -> Rotate positive (right tilt)
      // Positive deltaX (moving right) -> Rotate negative (left tilt)
      const rotation = -deltaX * 15;
      // Clamp rotation
      const clampedRotation = Math.max(-85, Math.min(85, rotation));
      this.sprite.style.transform = `rotate(${clampedRotation}deg)`;

      // Update start pos for next delta
      this.dragStartX = e.screenX;
      this.dragStartY = e.screenY;
    }
  }

  handleMouseUp(e) {
    if (e.button !== 0) {
      this.isMouseDown = false;
      this.isDragging = false;
      return;
    }

    if (this.isDragging) {
      this.endDrag();
    } else if (this.isMouseDown) {
      // It was a click!
      this.interact();
    }

    this.isMouseDown = false;
    this.isDragging = false;
  }

  startDrag() {
    this.isDragging = true;
    this.previousState = this.visualState;
    this.setVisualState("HELD");
    // Start with 0 rotation
    this.sprite.style.transform = "rotate(0deg)";
  }

  endDrag() {
    this.isDragging = false;
    // Reset rotation before changing state
    this.sprite.style.transform = "";
    // Return to IDLE or strictly previous state? Let's go IDLE to be safe/reset.
    this.setVisualState("IDLE");
    this.movementMode = "IDLE";
  }

  feed() {
    console.log("Nom nom nom! 🧀");
    this.vitals.hunger = Math.min(100, this.vitals.hunger + 50);

    // Explicitly set EATING state (decoupled from interact/Love)
    this.playSqueak(this.squeak1);

    if (this.visualState === "EATING") {
      this.sprite.classList.remove("state-eating");
      void this.sprite.offsetWidth;
      this.sprite.classList.add("state-eating");
    } else {
      this.setVisualState("EATING");
      this.movementMode = "IDLE"; // Stop moving to eat!
    }

    if (this.timers.interaction) clearTimeout(this.timers.interaction);
    this.timers.interaction = setTimeout(() => {
      if (this.visualState === "EATING") {
        this.setVisualState("IDLE"); // Always return to IDLE after eating
      }
    }, 1500);
  }

  goToSleep() {
    console.log("Going to sleep...");
    this.setVisualState("SLEEPING");
    this.movementMode = "IDLE";
  }

  playSqueak(audioObj) {
    try {
      // Clone node to allow overlapping sounds (spamming)
      const sound = audioObj.cloneNode();
      sound.volume = 0.5; // Optional: lower volume a bit if needed
      sound.play().catch((e) => console.error("Error playing sound:", e));
    } catch (e) {
      console.error("Audio error:", e);
    }
  }

  playRandomSqueak() {
    const randomSound =
      this.squeaks[Math.floor(Math.random() * this.squeaks.length)];
    this.playSqueak(randomSound);
  }

  checkWatchBehavior() {
    if (
      this.visualState === "SLEEPING" ||
      this.visualState === "EATING" ||
      this.visualState === "HELD" ||
      this.isDragging
    )
      return;

    // Only looking (changing facing direction) if idle or walking
    // If we are chasing (WALKING decision above), direction is already set.
    // If IDLE, we just want to face the cursor.
    const pacoX = window.screenX + 24;
    const pacoY = window.screenY + 24;
    const dist = Math.hypot(
      this.cursorGlobal.x - pacoX,
      this.cursorGlobal.y - pacoY,
    );

    if (dist < 100) {
      // STOP & STARE (Very close)
      // Force IDLE state
      if (this.visualState === "WALKING") {
        this.setVisualState("IDLE");
        this.movementMode = "IDLE";
      }

      // Face at cursor (Watch)
      const dx = this.cursorGlobal.x - pacoX;
      const dy = this.cursorGlobal.y - pacoY;

      // Determine dominant axis to face cursor
      if (Math.abs(dx) > Math.abs(dy)) {
        this.direction = { x: Math.sign(dx), y: 0 };
      } else {
        this.direction = { x: 0, y: Math.sign(dy) };
      }
      this.applyDirectionClasses();
      return;
    }
  }
}

module.exports = new PetBrain();
