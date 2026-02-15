# 🐭 Paco Virtual Desktop Pet

> _"Las mascotas nunca se van del todo, a veces simplemente se transforman en píxeles."_

Un tributo digital interactivo para inmortalizar a Paco. Esta aplicación de escritorio trae de vuelta a la ratita más querida en forma de compañero virtual que vive en tu pantalla, camina sobre tus ventanas y te acompaña mientras usas la PC.

![Paco Preview](src/renderer/assets/sprites.png)

## La Historia

Este proyecto nace como un regalo. La idea es trascender el regalo físico habitual y utilizar la programación para crear algo "vivo". Paco ahora habita en el entorno digital, manteniendo su personalidad curiosa y su amor por el queso.

## ✨ Características Actuales

- **Mascota de Escritorio**: Paco vive en tu pantalla, sobre tus ventanas.
- **Interacción**:
  - **Click Izquierdo**: Dale amor a Paco ❤️ (Animación + Sonido).
  - **Click Derecho (Menú)**:
    - 🧀 **Dar Quesito**: Aliméntalo.
    - 💤 **Mandar a Dormir**: Envíalo a descansar.
    - 🔧 **Modo Debug**: Activa/desactiva panel de pruebas.
    - **Despertar**: Si está durmiendo.
  - **Arrastrar**: Muévelo a donde quieras.
- **Sistema de Necesidades**:
  - **Hambre**: Aparece una burbuja de pensamiento 💭 cuando tiene hambre.
  - **Energía**: Se cansa si camina mucho. Si llega a 0, se duerme.
  - **Sueño**: Duerme para recuperar energía rápidamente.
- **Comportamiento**:
  - Camina, se queda quieto (IDLE), duerme y come.
  - **Modo Curioso**: Te mira si acercas el mouse.

### 📸 Galería de Sprites

#### Estados de Paco

**Caminando / Idle**
![Paco Caminando](src/renderer/assets/sprites.png)
_Sprite sheet completo - Paco en diferentes estados de movimiento_

**Comiendo Quesito** 🧀
![Paco Comiendo](src/renderer/assets/eating.png)
_Paco disfrutando su quesito favorito_

**Durmiendo** 💤
![Paco Durmiendo](src/renderer/assets/sleep.png)
_Paco tomando una siesta_

**Siendo Sostenido**
![Paco Sostenido](src/renderer/assets/held.png)
_Paco cuando lo arrastras_

**Recibiendo Amor** ❤️
![Paco con Amor](src/renderer/assets/love.png)
_Animación cuando le das clic izquierdo_

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
