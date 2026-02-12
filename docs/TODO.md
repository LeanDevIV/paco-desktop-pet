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
  - [x] Estados de ánimo (Hambre, Sueño, Aburrimiento).
    - [x] Hambre: Burbuja de pensamiento, comer queso, animación dedicada.
    - [x] Sueño: Dormir (con regeneración rápida), despertar manual o automático.
    - [x] Afecto: Interacción de amor (Click Izq), animación de corazones.

  - [x] **Modo Curioso**:
    - [x] Mirar al cursor cuando está cerca (< 300px).
    - [x] Quedarse quieto y mirar fijamente cuando está muy cerca (< 100px).
    - [x] Perseguir al cursor (Desactivado por ahora para no molestar).

- [ ] **Sonidos**:
  - [ ] Efectos de pasos.
  - [x] Sonido de comer.
  - [x] Chirridos aleatorios o al hacer clic.
- [x] **Arrastrar y Soltar**: Permitir mover a Paco con el mouse si molesta.
- [x] **Menú Contextual**:
  - [x] Dar de comer (Quesito).
  - [x] Mandar a dormir.
  - [x] Modo Debug (Toggle en bandeja de sistema).
  - [x] Cerrar / Salir.

## Sistema y Configuración

- [ ] **Empaquetado (.exe)**: Configurar `electron-builder` o `electron-forge` para generar instalable/portable.
- [ ] **Inicio Automático**: Configurar que se inicie con Windows (Auto-launch).
- [ ] **Persistencia**: Guardar posición y estado (hambre/sueño) al cerrar.
- [ ] **Soporte Multi-Monitor**: Asegurar que no se pierda entre pantallas o limitar a monitor principal.
