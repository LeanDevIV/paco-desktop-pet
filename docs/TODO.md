# Lista de Tareas Pendientes (Paco Pet)

## Sprites y Visuales

- [ ] **Incorporar Sprites Reales**:
  - [x] `sleep.png`: Animación de dormir (hacerse bolita).
  - [x] `eat.png`: Animación de comer (tira de frames).
  - [x] `squeak.png`: Animación de chirrido/habla ("SQUEAKY").
- [x] **Animaciones SQUEAKY**: Sincronizar animación de boca/movimiento con sonido.
- [x] **Cartel Visual de Error**: Notificación visual (burbuja o ícono) cuando ocurre un error interno.

## Comportamiento e Interacción

- [ ] **Profundizar Comportamiento**:
  - [ ] Estados de ánimo (Hambre, Sueño, Aburrimiento).

  - [ ] **Modo Curioso**:
    - [x] Mirar al cursor cuando está cerca.
    - [x] Perseguir al cursor si se aleja.

- [ ] **Sonidos**:
  - [ ] Efectos de pasos.
  - [x] Sonido de comer.
  - [x] Chirridos aleatorios o al hacer clic.
- [x] **Arrastrar y Soltar**: Permitir mover a Paco con el mouse si molesta.
- [ ] **Menú Contextual**: Clic derecho para opciones (Cerrar, Reiniciar, Siempre visibles, Silenciar).

## Sistema y Configuración

- [ ] **Empaquetado (.exe)**: Configurar `electron-builder` o `electron-forge` para generar instalable/portable.
- [ ] **Inicio Automático**: Configurar que se inicie con Windows (Auto-launch).
- [ ] **Persistencia**: Guardar posición y estado (hambre/sueño) al cerrar.
- [ ] **Soporte Multi-Monitor**: Asegurar que no se pierda entre pantallas o limitar a monitor principal.
