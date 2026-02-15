class PetAnimator {
  constructor(spriteElement) {
    this.sprite = spriteElement;
  }

  setVisualState(state) {
    this.sprite.classList.remove(
      "state-idle",
      "state-walking",
      "state-eating",
      "state-sleeping",
      "state-held",
      "state-love",
      "facing-up",
      "facing-down",
      "facing-left",
      "facing-right",
    );
    this.sprite.classList.add(`state-${state.toLowerCase()}`);
  }

  setDirection(direction) {
    this.sprite.classList.remove(
      "facing-up",
      "facing-down",
      "facing-left",
      "facing-right",
    );

    const { x, y } = direction;
    if (x > 0) this.sprite.classList.add("facing-right");
    else if (x < 0) this.sprite.classList.add("facing-left");
    else if (y > 0) this.sprite.classList.add("facing-down");
    else if (y < 0) this.sprite.classList.add("facing-up");
    else this.sprite.classList.add("facing-down");
  }

  setRotation(degrees) {
    const clamped = Math.max(-85, Math.min(85, degrees));
    this.sprite.style.transform = `rotate(${clamped}deg)`;
  }

  resetRotation() {
    this.sprite.style.transform = "";
  }
}

module.exports = PetAnimator;
