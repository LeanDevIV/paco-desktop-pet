// src/shared/PacoError.js

/**
 * Categorías de errores para facilitar el debugging y la respuesta de la UI.
 */
const ErrorCategories = {
  SYSTEM: "SYSTEM", // Fallos de OS, I/O, Red
  UI: "UI", // Fallos de renderizado o interacción
  LOGIC: "LOGIC", // Estados imposibles o lógica rota
  ASSET: "ASSET", // Recursos faltantes (imágenes, sonidos)
};

class PacoError extends Error {
  /**
   * @param {string} code - Código único del error (ej: 'INIT_001')
   * @param {string} category - Una de las ErrorCategories
   * @param {string} message - Mensaje descriptivo
   * @param {boolean} isFatal - Si es true, la app debería cerrarse o reiniciarse
   * @param {object} [metadata] - Datos extra para debug (stack, variables, etc)
   */
  constructor(code, category, message, isFatal = false, metadata = {}) {
    super(message);
    this.name = "PacoError";
    this.code = code;
    this.category = category;
    this.isFatal = isFatal;
    this.metadata = metadata;
    this.timestamp = new Date().toISOString();
  }

  // Método para convertir el error en un objeto plano (para pasar de Main a Renderer por IPC)
  toObject() {
    return {
      name: this.name,
      code: this.code,
      category: this.category,
      message: this.message,
      isFatal: this.isFatal,
      metadata: this.metadata,
      timestamp: this.timestamp,
    };
  }
}

module.exports = { PacoError, ErrorCategories };
