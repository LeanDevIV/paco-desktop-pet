const fs = require("fs");
const path = require("path");
const { ipcRenderer } = require("electron");

class PetStorage {
  constructor() {
    // Get user data path safely via IPC synchronous call
    // This avoids needing @electron/remote
    const userDataPath = ipcRenderer.sendSync("get-user-data-path");
    this.filePath = path.join(userDataPath, "paco-data.json");
    console.log("💾 Storage Path:", this.filePath);
  }

  save(data) {
    try {
      const payload = {
        ...data,
        timestamp: Date.now(),
      };
      fs.writeFileSync(this.filePath, JSON.stringify(payload, null, 2));
      // console.log("💾 Game Saved");
    } catch (err) {
      console.error("❌ Save Failed:", err);
    }
  }

  load() {
    try {
      if (!fs.existsSync(this.filePath)) return null;
      const raw = fs.readFileSync(this.filePath, "utf-8");
      return JSON.parse(raw);
    } catch (err) {
      console.error("❌ Load Failed:", err);
      return null;
    }
  }

  calculateOfflineDecay(lastTimestamp) {
    if (!lastTimestamp) return { hunger: 0, energy: 0, affection: 0 };

    const now = Date.now();
    const diffMs = now - lastTimestamp;
    const diffMinutes = Math.floor(diffMs / 60000);

    // Decay formula: e.g., 10 points per hour (approx 0.16 per minute)
    // Adjust as needed for balance
    const decayRate = 0.5; // 1 point every 2 minutes

    const decayAmount = Math.floor(diffMinutes * decayRate);

    console.log(
      `💤 Offline for ${diffMinutes} min. Decay: ${decayAmount} points.`,
    );

    return {
      hunger: decayAmount,
      energy: decayAmount, // Energy recovers if sleeping? Logic for now: simpler is better, maybe just decay hunger/energy
      affection: decayAmount * 0.5, // Love decays slower
    };
  }
}

module.exports = PetStorage;
