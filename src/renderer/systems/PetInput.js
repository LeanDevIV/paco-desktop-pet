class PetInput {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;

    this.isDragging = false;
    this.isMouseDown = false;
    this.dragStartX = 0;
    this.dragStartY = 0;

    this.setupListeners();
  }

  setupListeners() {
    this.container.addEventListener("mousedown", (e) =>
      this.handleMouseDown(e),
    );
    document.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    document.addEventListener("mouseup", (e) => this.handleMouseUp(e));

    window.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.callbacks.onContextMenu?.();
    });
  }

  handleMouseDown(e) {
    if (e.button !== 0) return;
    this.isMouseDown = true;
    this.dragStartX = e.screenX;
    this.dragStartY = e.screenY;
  }

  handleMouseMove(e) {
    if (!this.isMouseDown) return;

    if (!this.isDragging) {
      const dist = Math.hypot(
        e.screenX - this.dragStartX,
        e.screenY - this.dragStartY,
      );
      if (dist > 5) {
        this.isDragging = true;
        this.callbacks.onDragStart?.();
      }
    }

    if (this.isDragging) {
      const deltaX = e.screenX - this.dragStartX;
      const deltaY = e.screenY - this.dragStartY;
      this.callbacks.onDrag?.({ x: deltaX, y: deltaY });

      this.dragStartX = e.screenX;
      this.dragStartY = e.screenY;
    }
  }

  handleMouseUp(e) {
    if (e.button !== 0) {
      this.reset();
      return;
    }

    if (this.isDragging) {
      this.callbacks.onDragEnd?.();
    } else if (this.isMouseDown) {
      this.callbacks.onClick?.();
    }

    this.reset();
  }

  reset() {
    this.isMouseDown = false;
    this.isDragging = false;
  }

  destroy() {
    // Cleanup listeners
  }
}

module.exports = PetInput;
