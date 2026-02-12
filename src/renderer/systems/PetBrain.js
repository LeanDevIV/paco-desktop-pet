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

    this.DECISION_RATE = 2500;
    this.MOVE_SPEED = 5;

    // Audio
    this.squeak1 = new Audio("./assets/Squeaking.mp3");
    this.squeak2 = new Audio("./assets/Squeaking-2.mp3");
    this.squeak3 = new Audio("./assets/Squeaking-3.mp3");
    this.squeaks = [this.squeak1, this.squeak2, this.squeak3];

    // Dragging State
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.isMouseDown = false;

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
  }

  startLifeCycle() {
    this.timers.decision = setInterval(
      () => this.makeDecision(),
      this.DECISION_RATE,
    );
    this.timers.physics = setInterval(() => this.updatePhysics(), 50);
  }

  makeDecision() {
    if (this.visualState === "EATING" || this.isDragging) return;

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
    if (dist < 50) {
      this.setVisualState("IDLE");
      this.movementMode = "IDLE";
      return;
    }

    // If nearby but not too close (Chase)
    if (dist > 100 && dist < 400) {
      this.setVisualState("WALKING");
      this.movementMode = "WALKING";
      // Calculate direction normal
      const dx = this.cursorGlobal.x - pacoX;
      const dy = this.cursorGlobal.y - pacoY;
      // Normalize
      this.direction = {
        x: dx / dist,
        y: dy / dist,
      };
      return; // Override other decisions
    }

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
      "state-eating",
      "state-sleeping",
      "state-held",
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
    console.log("Interact: Munching!");

    // Play Squeak (Spam-able)
    this.playSqueak(this.squeak1);

    // Force reset of eating state to replay animation if clicked again
    if (this.visualState === "EATING") {
      this.sprite.classList.remove("state-eating");
      void this.sprite.offsetWidth; // Trigger reflow
      this.sprite.classList.add("state-eating"); // Re-add manually since setVisualState will exit early
    } else {
      this.setVisualState("EATING");
    }

    // Clear any existing reset timer if spamming
    if (this.timers.eating) clearTimeout(this.timers.eating);

    this.timers.eating = setTimeout(() => {
      if (this.visualState === "EATING") {
        // Revert visual state to match the current movement mode
        this.setVisualState(
          this.movementMode === "WALKING" ? "WALKING" : "IDLE",
        );
      }
    }, 1500); // 1.5s duration
  }

  // --- Drag & Drop Logic ---

  handleMouseDown(e) {
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

    if (dist < 50) {
      // STOP & STARE (Very close)
      // Force IDLE state
      if (this.visualState !== "IDLE") {
        this.setVisualState("IDLE");
        this.movementMode = "IDLE";
      }
      // Face Down (Look at screen/user)
      this.direction = { x: 0, y: 0 };
      this.applyDirectionClasses(); // Will default to facing-down
      return;
    }

    if (dist < 300) {
      // Look at cursor (Watch)
      const dx = this.cursorGlobal.x - pacoX;
      const dy = this.cursorGlobal.y - pacoY;

      // Simple 4-way direction for sprite
      // We need to set this.direction so applyDirectionClasses works
      // But we don't want to MOVE if we are IDLE.
      // So we just update the visual classes directly or update direction but ensure movement code checks state?
      // updatePhysics checks movementMode === "WALKING". So updating `this.direction` is safe for IDLE state.

      // Determine dominant axis
      if (Math.abs(dx) > Math.abs(dy)) {
        this.direction = { x: Math.sign(dx), y: 0 };
      } else {
        this.direction = { x: 0, y: Math.sign(dy) };
      }
      this.applyDirectionClasses();
    }
  }
}

module.exports = new PetBrain();
