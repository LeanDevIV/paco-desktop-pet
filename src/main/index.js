const {
  app,
  BrowserWindow,
  screen,
  ipcMain,
  Tray,
  Menu,
  MenuItem,
} = require("electron");
const path = require("path");
const { PacoError, ErrorCategories } = require("../shared/PacoError");

// Mantener referencias globales para evitar que el GC (Garbage Collector) las borre
let mainWindow = null;
let tray = null;

// Configuración de la ventana para que sea una mascota de escritorio
const WINDOW_CONFIG = {
  width: 200, // Tamaño inicial de Paco
  height: 200,
  frame: false, // Sin bordes de Windows
  transparent: true, // Fondo invisible
  alwaysOnTop: true, // Siempre encima de otras ventanas
  resizable: false, // Que no le cambien el tamaño arrastrando
  skipTaskbar: true, // Que no aparezca en la barra de tareas (solo en el Tray)
  webPreferences: {
    nodeIntegration: true, // Para prototipo rápido (en prod idealmente false + preload)
    contextIsolation: false,
    // preload: path.join(__dirname, 'preload.js') // Descomentar cuando usemos preload
  },
};

ipcMain.handle("show-context-menu", (event) => {
  const menu = new Menu();
  menu.append(
    new MenuItem({
      label: "🧀 Dar Quesito (Feed)",
      click: () => {
        event.sender.send("feed-paco");
      },
    }),
  );
  menu.append(
    new MenuItem({
      label: "💤 Mandar a dormir (Sleep)",
      click: () => {
        event.sender.send("sleep-paco");
      },
    }),
  );
  menu.append(new MenuItem({ type: "separator" }));
  menu.append(new MenuItem({ label: "Salir", role: "quit" }));

  menu.popup({ window: BrowserWindow.fromWebContents(event.sender) });
});

function createPacoWindow() {
  try {
    const { width: screenWidth, height: screenHeight } =
      screen.getPrimaryDisplay().workAreaSize;

    mainWindow = new BrowserWindow({
      ...WINDOW_CONFIG,
      x: screenWidth - 250, // Posición inicial: esquina inferior derecha
      y: screenHeight - 250,
    });

    mainWindow.webContents.openDevTools({ mode: "detach" });

    // Cargar el HTML (la cara de Paco)
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));

    // Ignorar eventos del ratón en las partes transparentes (CRÍTICO para desktop pets)
    // mainWindow.setIgnoreMouseEvents(true, { forward: true }); // Habilitar dinámicamente según si el mouse está sobre la rata o no

    mainWindow.on("closed", () => {
      mainWindow = null;
    });

    // Handler de errores de carga
    mainWindow.webContents.on(
      "did-fail-load",
      (event, errorCode, errorDescription) => {
        throw new PacoError(
          `LOAD_${errorCode}`,
          ErrorCategories.SYSTEM,
          `Fallo al cargar UI: ${errorDescription}`,
          true,
        );
      },
    );
  } catch (error) {
    handleFatalError(error);
  }
}

// Inicialización de la App
app.whenReady().then(() => {
  // Truco para Windows: A veces la transparencia falla sin esto
  setTimeout(createPacoWindow, 500);

  // Crear Tray Icon (Icono en la barra de reloj)
  // Nota: Necesitás un icon.png en assets. Por ahora usará el default si falla.
  try {
    tray = new Tray(path.join(__dirname, "../renderer/assets/cheese.png"));
    const contextMenu = Menu.buildFromTemplate([
      { label: "Despertar a Paco", click: () => mainWindow.show() },
      { label: "Dormir (Salir)", click: () => app.quit() },
      { type: "separator" },
      {
        label: "Ver Necesidades",
        type: "checkbox",
        checked: false,
        click: (item) => {
          if (mainWindow)
            mainWindow.webContents.send("toggle-vitals", item.checked);
        },
      },
      {
        label: "Modo Debug",
        type: "checkbox",
        checked: false,
        click: (item) => {
          if (mainWindow)
            mainWindow.webContents.send("toggle-debug", item.checked);
        },
      },
    ]);
    tray.setToolTip("Paco Virtual");
    tray.setContextMenu(contextMenu);
    // Start tracking cursor for "Curious Mode"
    setInterval(() => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      const point = screen.getCursorScreenPoint();
      mainWindow.webContents.send("cursor-update", point);
    }, 100);
  } catch (e) {
    console.log("No se pudo cargar el icono del tray, usando default.");
  }
});

// Salir cuando todas las ventanas estén cerradas
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
// --- IPC HANDLERS (La comunicación) ---

// Escuchar petición de movimiento desde el cerebro
// Escuchar la orden de movimiento desde el cerebro
// Escuchar la orden de movimiento desde el cerebro (Walking)
ipcMain.on("paco-move", (event, { x, y }) => {
  if (!mainWindow) return;
  try {
    const bounds = mainWindow.getBounds();
    const { width: screenWidth, height: screenHeight } =
      screen.getPrimaryDisplay().workAreaSize;

    // Calculate new positions
    let newX = bounds.x + x;
    let newY = bounds.y + y;

    // Clamp to screen edges (Relaxed clamping)
    // Keep at least part of window visible? Or fully inside?
    // Let's keep fully inside for walking logic
    if (newX < 0) newX = 0;
    if (newX > screenWidth - bounds.width) newX = screenWidth - bounds.width;

    // Removed strict bottom 150px clamping. Now allows full height walking if logic permits.
    // If PetBrain only walks horizontally, this Y check is less critical but good for safety.
    if (newY < 0) newY = 0;
    if (newY > screenHeight - bounds.height)
      newY = screenHeight - bounds.height;

    mainWindow.setBounds({
      x: Math.round(newX),
      y: Math.round(newY),
      width: bounds.width,
      height: bounds.height,
    });
  } catch (e) {
    // Ignorar errores menores de movimiento
  }
});

// Escuchar evento de arrastre desde el usuario
ipcMain.on("paco-drag", (event, { x, y }) => {
  if (!mainWindow) return;
  try {
    const bounds = mainWindow.getBounds();
    // x and y are deltas from renderer (screenX diffs)

    let newX = bounds.x + x;
    let newY = bounds.y + y;

    // Optional: Add clamping here too if we want to prevent dragging off-screen
    // For now, let's allow free dragging but maybe keep logic simple

    mainWindow.setBounds({
      x: Math.round(newX),
      y: Math.round(newY),
      width: bounds.width,
      height: bounds.height,
    });
  } catch (e) {
    console.error("Drag error:", e);
  }
});
// --- SISTEMA DE ERRORES CENTRALIZADO ---

function handleFatalError(error) {
  console.error("🔥 ERROR FATAL EN MAIN:", error);
  // Aquí podrías guardar un log en disco antes de morir
  if (mainWindow && !mainWindow.isDestroyed()) {
    // Intentar avisar al renderer para que muestre cara de "muerto"
    mainWindow.webContents.send(
      "error-report",
      error instanceof PacoError
        ? error.toObject()
        : new PacoError(
            "UNK_999",
            ErrorCategories.UNKNOWN,
            error.message,
            true,
          ),
    );
  }
  // app.quit(); // Opcional: Cerrar después de notificar
}

// Capturar errores no manejados de Node
process.on("uncaughtException", (error) => {
  handleFatalError(
    new PacoError("UNC_001", ErrorCategories.SYSTEM, error.message, true),
  );
});
