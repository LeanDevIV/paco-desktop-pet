El proyecto utiliza Electron con una arquitectura de dos procesos:

Proceso Main (src/main/index.js):

Responsable de la ventana principal (BrowserWindow) con transparent: true, frame: false y alwaysOnTop: true.

Comunica con el Renderer vía ipcMain.

Proceso Renderer (src/renderer/index.js):

Contiene la lógica de la mascota (PetBrain) y la interfaz de usuario.

Se comunica con el Main vía ipcRenderer.

Comunicación entre procesos:

Se realiza mediante ipcMain y ipcRenderer.

Los errores se capturan globalmente y se muestran en la UI si es posible, o en un log de archivo si es fatal.
