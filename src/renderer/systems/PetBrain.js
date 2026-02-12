// src/renderer/systems/PetBrain.js
const { ipcRenderer } = require("electron");
const { PacoError, ErrorCategories } = require("../../shared/PacoError");

class PetBrain {
  constructor() {
    this.state = "IDLE"; // Estados: IDLE, WALKING, INTERACTING
    this.timers = {};
    this.position = { x: 0, y: 0 }; // Se sincronizará con el main

    // Configuración de comportamiento
    this.DECISION_RATE = 2000; // Cada cuánto decide qué hacer (ms)
    this.MOVE_SPEED = 5; // Pixeles por tick
  }

  init() {
    console.log("🧠 Cerebro de Paco: Online");
    this.startLifeCycle();

    // Escuchar posición inicial del main (necesitamos pedirla primero)
    // Por ahora asumimos que el main nos manda updates o nosotros mandamos deltas.
  }

  startLifeCycle() {
    // Loop principal de decisiones
    this.timers.decision = setInterval(
      () => this.makeDecision(),
      this.DECISION_RATE,
    );

    // Loop de animación/física (más rápido)
    this.timers.physics = setInterval(() => this.updatePhysics(), 50);
  }

  makeDecision() {
    if (this.state === "INTERACTING") return; // Si lo estás tocando, no decide nada

    const rand = Math.random();

    // 30% chance de caminar, 70% de quedarse quieto respirando
    if (rand > 0.7) {
      this.changeState("WALKING");
      // Elegir dirección aleatoria (-1 izquierda/arriba, 1 derecha/abajo)
      this.direction = {
        x: Math.random() > 0.5 ? 1 : -1,
        y: Math.random() > 0.5 ? 1 : -1,
      };
    } else {
      this.changeState("IDLE");
    }
  }
  changeState(newState) {
    // console.log(`Paco cambia de ${this.state} a ${newState}`);
    this.state = newState;

    const sprite = document.getElementById("paco-sprite");

    if (newState === "WALKING") {
      sprite.classList.add("walk-anim");
      this.updateDirectionSprite(); // Orientarlo apenas empieza a caminar
    } else if (newState === "IDLE") {
      sprite.classList.remove("walk-anim");
      // Opcional: Volver a facing-down o dejarlo como quedó
      sprite.className = "sprite facing-down";
    } else if (newState === "INTERACTING") {
      sprite.classList.remove("walk-anim");
      // Hack visual para comer: Vibrar
      // (Podrías agregar una clase CSS .shake aquí)
    }
  }

  // Nuevo método para decidir qué fila del sprite usar
  updateDirectionSprite() {
    const sprite = document.getElementById("paco-sprite");

    // Limpiar direcciones anteriores
    sprite.classList.remove(
      "facing-up",
      "facing-down",
      "facing-left",
      "facing-right",
    );

    // Prioridad: Si se mueve en X, mira a los lados. Si solo se mueve en Y, mira arriba/abajo.
    if (Math.abs(this.direction.x) > 0) {
      if (this.direction.x > 0) sprite.classList.add("facing-right");
      else sprite.classList.add("facing-left");
    } else {
      if (this.direction.y > 0)
        sprite.classList.add("facing-down"); // Y positivo es abajo en pantallas
      else sprite.classList.add("facing-up");
    }
  }

  updatePhysics() {
    if (this.state === "WALKING") {
      try {
        // Actualizamos el sprite por si cambió de rumbo repentinamente
        this.updateDirectionSprite();

        ipcRenderer.send("paco-move", {
          x: this.direction.x * this.MOVE_SPEED,
          y: this.direction.y * this.MOVE_SPEED,
        });
      } catch (error) {
        // ... error handling
      }
    }
  }

  interact() {
    this.changeState("INTERACTING");
    const sprite = document.getElementById("paco-sprite");

    sprite.className = "sprite facing-down eating"; // Se pone de frente y vibra

    setTimeout(() => {
      sprite.classList.remove("eating");
      this.makeDecision();
    }, 1500); // Come por un segundo y medio
  }
}

module.exports = new PetBrain();
