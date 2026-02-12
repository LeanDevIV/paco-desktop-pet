const { app, BrowserWindow, screen, ipcMain, Tray, Menu } = require("electron");
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
    tray = new Tray(path.join(__dirname, "../renderer/assets/sprites.png"));
    const contextMenu = Menu.buildFromTemplate([
      { label: "Despertar a Paco", click: () => mainWindow.show() },
      { label: "Dormir (Salir)", click: () => app.quit() },
    ]);
    tray.setToolTip("Paco Virtual");
    tray.setContextMenu(contextMenu);
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
ipcMain.on("paco-move", (event, { x, y }) => {
  if (!mainWindow) return;
  try {
    const bounds = mainWindow.getBounds();
    mainWindow.setBounds({
      x: Math.round(bounds.x + x),
      y: Math.round(bounds.y + y),
      width: bounds.width,
      height: bounds.height,
    });
  } catch (e) {
    // Ignorar errores menores de movimiento
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
