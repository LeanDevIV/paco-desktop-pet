class LevelSystem {
  constructor(initialXP = 0) {
    this.xp = initialXP;
    this.level = this.calculateLevel(this.xp);
  }

  calculateLevel(xp) {
    // Formula: Level = sqrt(XP / 100)
    // XP needed per level: 100, 400, 900, 1600...
    return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
  }

  addXP(amount) {
    this.xp += amount;
    const newLevel = this.calculateLevel(this.xp);
    if (newLevel > this.level) {
      this.level = newLevel;
      return { leveledUp: true, level: this.level };
    }
    return { leveledUp: false, level: this.level };
  }

  getStats() {
    return {
      xp: Math.floor(this.xp),
      level: this.level,
      nextLevelXP: Math.pow(this.level, 2) * 100, // XP needed for NEXT level
    };
  }
}

module.exports = LevelSystem;
