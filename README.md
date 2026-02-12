# 🐭 Paco Virtual Desktop Pet

> _"Las mascotas nunca se van del todo, a veces simplemente se transforman en píxeles."_

Un tributo digital interactivo para inmortalizar a Paco. Esta aplicación de escritorio trae de vuelta a la ratita más querida en forma de compañero virtual que vive en tu pantalla, camina sobre tus ventanas y te acompaña mientras usas la PC.

![Paco Preview](src/renderer/assets/sprites.png)

## La Historia

Este proyecto nace como un regalo. La idea es trascender el regalo físico habitual y utilizar la programación para crear algo "vivo". Paco ahora habita en el entorno digital, manteniendo su personalidad curiosa y su amor por el queso.

## ✨ Funcionalidades (The MVP)

- **Overlay Transparente:** Paco vive "encima" de todas las ventanas (`Always on Top`), pero respeta tu espacio de trabajo.
- **Comportamiento Autónomo:**
  - **Idle:** Se queda quieto observando.
  - **Roaming:** Camina aleatoriamente por los límites de tu pantalla.
  - **Interacción:** Reacciona a los clics del mouse.
- **Sistema de Sprites Dinámico:** Soporte para múltiples animaciones (Caminar, Comer, Dormir) mediante cambios de estado en CSS.
- **Bajo Consumo:** Optimizado para no comerse la RAM (solo el queso).

### 📸 Galería

![Paco Durmiendo](src/renderer/assets/sleep.png)
_Paco tomando una siesta_

## 🛠️ Stack Tecnológico

Este proyecto fue construido utilizando tecnologías web modernas empaquetadas para escritorio:

- **Core:** [Electron.js](https://www.electronjs.org/) (v34+)
- **Lógica (Brain):** Vanilla JavaScript (Node.js integration).
- **Renderizado:** HTML5 + CSS3 Animations.
- **Arte:** Pixel Art customizado (Krita).
- **Arquitectura:**
  - `Main Process`: Manejo de ventana, transparencia y eventos del sistema (Tray).
  - `Renderer Process`: Motor de estados (`PetBrain.js`) y renderizado de sprites.

## 📝 Roadmap & Ideas Futuras

- [ ] **Persistencia:** Que Paco recuerde dónde estaba antes de cerrar la PC.
- [ ] **Needs System:** Medidor de hambre y sueño.
- [ ] **Drag & drop:** Poder reubicar a Paco donde queramos.
- [ ] **Sound FX:** Soniditos de squeak aleatorios.
- [ ] **Desktop Interaction:** Que pueda "sentarse" sobre la barra de tareas.
