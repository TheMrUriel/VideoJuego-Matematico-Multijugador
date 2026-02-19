# 🎮 Videojuego Multijugador Educativo de Matemáticas

Videojuego multijugador educativo desarrollado como aplicación web y adaptado a dispositivo móvil Android.  
Está dirigido a estudiantes de **3° y 4° grado de primaria**, con el objetivo de fortalecer sus habilidades matemáticas mediante una dinámica competitiva 1 vs 1.

---

## 📖 Descripción del Proyecto

El videojuego permite que dos jugadores compitan en un mismo dispositivo resolviendo problemas matemáticos en el menor tiempo posible.

Cada jugador cuenta con:

- Barra de vida
- Temporizador
- Panel numérico para responder

### Dinámica del juego

- Si el jugador responde correctamente, inflige daño proporcional al tiempo al oponente.
- Si responde incorrectamente, pierde vida propia.
- Gana el jugador que conserve vida al finalizar la partida.
- Al terminar, se muestran estadísticas, medallas y recomendaciones de mejora.

El juego funciona completamente **sin conexión a internet**, permitiendo su uso en entornos educativos con acceso limitado a red.

---

## 🧠 Temas Matemáticos Incluidos

- Sumas
- Restas
- Multiplicaciones
- Secuencia numérica
- Comparación de números (mayor que / menor que)
- Suma de cantidades
- Figuras geométricas
- Números romanos
- Fracciones

---

## 🛠 Tecnologías Utilizadas

- **Next.js**
- **React**
- **Bootstrap**
- **React Icons**
- **Capacitor**
- **Android Studio**

---

## 💻 Requisitos del Sistema

### Para desarrollo web

- Node.js >= 20
- npm >= 10

### Para versión Android

- Android Studio
- Java JDK 17
- Capacitor

---

## 🚀 Instalación y Ejecución (Versión Web)

### Clonar el repositorio

```bash
git clone https://github.com/TheMrUriel/VideoJuego-Matematico-Multijugador.git
```

### Ingresar al directorio:

```bash
cd VideoJuego-Matematico-Multijugador
```

### Instalar dependencias:

```bash
npm install
```

### Ejecutar en modo desarrollo:

```bash
npm run dev
```

### Abrir en navegador:

```arduino
http://localhost:3000
```

---

## 📦 Generar versión de producción

```bash
npm run build
npm run export
```

---

## 📱 Convertir a aplicación Android

### Instalar dependencias móviles:

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android
```

### Inicializar y configurar:

```bash
npx cap init
npx cap add android
npx cap sync
```

### Abrir en Android Studio:

```bash
npx cap open android
```

Desde Android Studio se puede ejecutar en emulador o dispositivo físico y generar el APK.

---

## 🎯 Características principales

- Multijugador local en un solo dispositivo.
- Funcionamiento sin conexión a internet.
- Sistema de vida y temporizador.
- Retroalimentación inmediata.
- Sistema de medallas y recomendaciones.
- Adaptación a dispositivos móviles Android.

---

## 📖 Proyecto académico

Este videojuego fue desarrollado como parte de un proyecto de investigación con el objetivo de potenciar las habilidades matemáticas en estudiantes de nivel primaria mediante el uso de herramientas tecnológicas interactivas.

## 👨‍💻 Autor

Uriel Rivera Pulgarín - 202381

2026
