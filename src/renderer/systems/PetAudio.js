class PetAudio {
  constructor(assetPaths = {}) {
    this.sounds = {
      squeak1: new Audio(assetPaths.squeak1 || "./assets/Squeaking.mp3"),
      squeak2: new Audio(assetPaths.squeak2 || "./assets/Squeaking-2.mp3"),
      squeak3: new Audio(assetPaths.squeak3 || "./assets/Squeaking-3.mp3"),
    };

    this.squeaks = [
      this.sounds.squeak1,
      this.sounds.squeak2,
      this.sounds.squeak3,
    ];
  }

  playSqueak(soundKey = null) {
    try {
      const sound = soundKey ? this.sounds[soundKey] : this._getRandomSqueak();
      const clone = sound.cloneNode();
      clone.volume = 0.5;
      clone.play().catch((e) => console.error("Audio error:", e));
    } catch (e) {
      console.error("Audio setup error:", e);
    }
  }

  _getRandomSqueak() {
    return this.squeaks[Math.floor(Math.random() * this.squeaks.length)];
  }

  playRandomSqueak() {
    this.playSqueak();
  }
}

module.exports = PetAudio;
